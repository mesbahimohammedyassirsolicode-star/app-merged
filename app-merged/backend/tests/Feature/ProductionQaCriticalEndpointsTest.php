<?php

namespace Tests\Feature;

use App\Models\AnneeScolaire;
use App\Models\Filiere;
use App\Models\Groupe;
use App\Models\Message;
use App\Models\Module;
use App\Models\Niveau;
use App\Models\Stagiaire;
use App\Models\StudentParent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProductionQaCriticalEndpointsTest extends TestCase
{
    use RefreshDatabase;

    public function test_health_endpoint_is_public_and_stable(): void
    {
        $response = $this->getJson('/api/v1/health');

        $response->assertOk();
        $response->assertJsonPath('data.status', 'healthy');
        $response->assertJsonPath('data.checks.app', 'ok');
        $response->assertJsonPath('data.checks.database', 'ok');
    }

    public function test_login_rejects_missing_fields_with_422(): void
    {
        $response = $this->postJson('/api/v1/login', []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_login_rejects_inactive_user_with_403(): void
    {
        User::factory()->create([
            'email' => 'inactive.qa@test.com',
            'password' => bcrypt('password123'),
            'role' => 'student',
            'is_active' => false,
        ]);

        $response = $this->postJson('/api/v1/login', [
            'email' => 'inactive.qa@test.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(403);
    }

    public function test_login_is_throttled_after_repeated_failures(): void
    {
        User::factory()->create([
            'email' => 'throttle.qa@test.com',
            'password' => bcrypt('correct-password'),
            'role' => 'student',
            'is_active' => true,
        ]);

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/login', [
                'email' => 'throttle.qa@test.com',
                'password' => 'wrong-password',
            ])->assertStatus(401);
        }

        $response = $this->postJson('/api/v1/login', [
            'email' => 'throttle.qa@test.com',
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(429);
    }

    public function test_logout_invalidates_current_token(): void
    {
        $user = User::factory()->create([
            'role' => 'admin',
            'is_active' => true,
        ]);
        $token = $user->createToken('qa-test-token')->plainTextToken;
        $tokenId = (int) explode('|', $token)[0];

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/v1/logout')
            ->assertOk();

        $this->assertDatabaseMissing('personal_access_tokens', [
            'id' => $tokenId,
            'tokenable_id' => $user->id,
        ]);
    }

    public function test_non_admin_cannot_create_users(): void
    {
        $teacher = User::factory()->create([
            'role' => 'teacher',
            'is_active' => true,
        ]);
        Sanctum::actingAs($teacher);

        $response = $this->postJson('/api/v1/users', [
            'name' => 'Student Candidate',
            'email' => 'student.candidate@test.com',
            'password' => 'ValidPass123!',
            'role' => 'student',
            'cin' => 'AA123456',
            'cef_number' => 'CEF-QA-001',
            'date_naissance' => '2004-01-01',
        ]);

        $response->assertForbidden();
    }

    public function test_admin_user_creation_validates_role_and_unique_email(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'is_active' => true,
        ]);
        User::factory()->create(['email' => 'dup.user@test.com']);

        Sanctum::actingAs($admin);

        $invalidRole = $this->postJson('/api/v1/users', [
            'name' => 'Invalid Role User',
            'email' => 'new.user@test.com',
            'password' => 'ValidPass123!',
            'role' => 'super-admin',
        ]);
        $invalidRole->assertStatus(422);
        $invalidRole->assertJsonValidationErrors(['role']);

        $duplicateEmail = $this->postJson('/api/v1/users', [
            'name' => 'Duplicate Email User',
            'email' => 'dup.user@test.com',
            'password' => 'ValidPass123!',
            'role' => 'admin',
        ]);
        $duplicateEmail->assertStatus(422);
        $duplicateEmail->assertJsonValidationErrors(['email']);
    }

    public function test_parent_cannot_access_non_linked_child_attendance_idor_protection(): void
    {
        $ctx = $this->seedAcademicContext();
        $parentUser = User::factory()->create([
            'role' => 'parent',
            'is_active' => true,
        ]);
        $parent = StudentParent::create([
            'user_id' => $parentUser->id,
            'cin' => 'PA-QA-001',
            'phone' => '0600000011',
            'address' => 'QA Address',
        ]);
        $parent->stagiaires()->attach($ctx['stagiaire']->id);

        $otherStudentUser = User::factory()->create([
            'role' => 'stagiaire',
            'is_active' => true,
        ]);
        $otherStagiaire = Stagiaire::create([
            'user_id' => $otherStudentUser->id,
            'filiere_id' => $ctx['filiere']->id,
            'groupe_id' => $ctx['group']->id,
            'cef_number' => 'CEF-QA-999',
            'cin' => 'BB654321',
            'date_naissance' => '2003-02-02',
            'status' => 'actif',
        ]);

        Sanctum::actingAs($parentUser);

        $this->getJson('/api/v1/parent/children/'.$ctx['stagiaire']->id.'/attendance')->assertOk();
        $this->getJson('/api/v1/parent/children/'.$otherStagiaire->id.'/attendance')->assertForbidden();
    }

    public function test_course_file_upload_rejects_unsupported_file_type(): void
    {
        Storage::fake('local');
        $ctx = $this->seedAcademicContext();
        $teacher = User::factory()->create([
            'role' => 'teacher',
            'is_active' => true,
        ]);
        $ctx['module']->trainers()->syncWithoutDetaching([$teacher->id]);

        Sanctum::actingAs($teacher);

        $response = $this->postJson('/api/v1/course-files', [
            'file' => UploadedFile::fake()->create('malicious.exe', 50, 'application/x-msdownload'),
            'filiere_id' => $ctx['filiere']->id,
            'module_id' => $ctx['module']->id,
            'title' => 'Malicious Binary',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['file']);
    }

    public function test_student_cannot_upload_course_file_due_to_role_policy(): void
    {
        Storage::fake('local');
        $ctx = $this->seedAcademicContext();

        Sanctum::actingAs($ctx['student_user']);

        $response = $this->postJson('/api/v1/course-files', [
            'file' => UploadedFile::fake()->create('notes.pdf', 100, 'application/pdf'),
            'filiere_id' => $ctx['filiere']->id,
            'module_id' => $ctx['module']->id,
            'title' => 'Student Upload Attempt',
        ]);

        $response->assertForbidden();
    }

    public function test_message_read_endpoint_blocks_non_receiver_idor(): void
    {
        $sender = User::factory()->create(['role' => 'teacher', 'is_active' => true]);
        $receiver = User::factory()->create(['role' => 'student', 'is_active' => true]);
        $attacker = User::factory()->create(['role' => 'parent', 'is_active' => true]);

        $message = Message::create([
            'sender_id' => $sender->id,
            'receiver_id' => $receiver->id,
            'content' => 'Private content',
        ]);

        Sanctum::actingAs($attacker);
        $this->postJson('/api/v1/messages/'.$message->id.'/read')->assertForbidden();
    }

    public function test_feedback_endpoint_validates_payload_and_prevents_token_reuse(): void
    {
        $invalid = $this->postJson('/api/v1/feedbacks', [
            'category' => 'invalid-category',
            'content' => 'short',
        ]);
        $invalid->assertStatus(422);
        $invalid->assertJsonValidationErrors(['category', 'content']);

        $token = str_repeat('a', 64);
        $this->postJson('/api/v1/feedbacks', [
            'category' => 'pedagogie',
            'content' => str_repeat('Good platform feedback. ', 2),
            'submission_token' => $token,
        ])->assertCreated();

        $duplicate = $this->postJson('/api/v1/feedbacks', [
            'category' => 'pedagogie',
            'content' => str_repeat('Repeated submission payload. ', 2),
            'submission_token' => $token,
        ]);
        $duplicate->assertStatus(422);
    }

    public function test_cart_endpoint_rejects_sql_injection_like_product_id_payload(): void
    {
        $student = User::factory()->create([
            'role' => 'student',
            'is_active' => true,
        ]);
        Sanctum::actingAs($student);

        $response = $this->postJson('/api/v1/cart/items', [
            'product_id' => '1 OR 1=1',
            'quantity' => 1,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['product_id']);
    }

    public function test_order_creation_blocks_cart_ownership_idor(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $owner = User::factory()->create(['role' => 'student', 'is_active' => true]);
        $attacker = User::factory()->create(['role' => 'student', 'is_active' => true]);

        Sanctum::actingAs($admin);
        $productId = $this->postJson('/api/v1/products', [
            'name' => 'Ownership Guard Product',
            'price' => 25.50,
            'stock' => 20,
            'is_active' => true,
        ])->json('data.id');

        Sanctum::actingAs($owner);
        $this->postJson('/api/v1/cart/items', [
            'product_id' => $productId,
            'quantity' => 2,
        ])->assertOk();
        $ownerCartId = $this->getJson('/api/v1/cart/me')->json('data.id');

        Sanctum::actingAs($attacker);
        $response = $this->postJson('/api/v1/orders', [
            'cart_id' => $ownerCartId,
            'shipping_address' => 'Attacker shipping address',
            'payment_method' => 'card',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['cart_id']);
    }

    public function test_messages_accept_xss_payload_without_server_error_and_store_raw_content(): void
    {
        $sender = User::factory()->create(['role' => 'teacher', 'is_active' => true]);
        $receiver = User::factory()->create(['role' => 'student', 'is_active' => true]);
        Sanctum::actingAs($sender);

        $payload = '<script>alert("xss")</script>hello';
        $response = $this->postJson('/api/v1/messages', [
            'receiver_id' => $receiver->id,
            'content' => $payload,
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('messages', [
            'sender_id' => $sender->id,
            'receiver_id' => $receiver->id,
            'content' => $payload,
        ]);
    }

    /**
     * @return array{
     *   year: AnneeScolaire,
     *   filiere: Filiere,
     *   group: Groupe,
     *   module: Module,
     *   student_user: User,
     *   stagiaire: Stagiaire
     * }
     */
    private function seedAcademicContext(): array
    {
        $year = AnneeScolaire::create([
            'year_start' => 2025,
            'year_end' => 2026,
            'label' => '2025-2026',
            'is_current' => true,
            'start_date' => '2025-09-01',
            'end_date' => '2026-06-30',
        ]);

        $niveau = Niveau::create([
            'name' => 'Technicien Specialise',
            'label' => 'Technicien Specialise',
            'code' => 'TS',
        ]);

        $filiere = Filiere::create([
            'niveau_id' => $niveau->id,
            'name' => 'Developpement Digital',
            'label' => 'Developpement Digital',
            'code' => 'DD',
        ]);

        $group = Groupe::create([
            'niveau_id' => $niveau->id,
            'filiere_id' => $filiere->id,
            'annee_scolaire_id' => $year->id,
            'name' => 'DD-101',
            'label' => 'DD-101',
            'year_level' => 1,
            'capacity' => 30,
        ]);

        $module = Module::create([
            'niveau_id' => $niveau->id,
            'filiere_id' => $filiere->id,
            'code' => 'M-DD-01',
            'name' => 'Laravel',
            'label' => 'Laravel',
            'masse_horaire' => 60,
            'coefficient' => 2,
            'semester' => 'S1',
        ]);

        $studentUser = User::factory()->create([
            'role' => 'student',
            'is_active' => true,
        ]);

        $stagiaire = Stagiaire::create([
            'user_id' => $studentUser->id,
            'filiere_id' => $filiere->id,
            'groupe_id' => $group->id,
            'cef_number' => 'CEF-QA-100',
            'cin' => 'AA123450',
            'date_naissance' => '2004-01-01',
            'status' => 'actif',
        ]);

        DB::table('groupe_stagiaire')->insert([
            'groupe_id' => $group->id,
            'stagiaire_id' => $stagiaire->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return [
            'year' => $year,
            'filiere' => $filiere,
            'group' => $group,
            'module' => $module,
            'student_user' => $studentUser,
            'stagiaire' => $stagiaire,
        ];
    }
}

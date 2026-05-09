<?php

namespace Tests\Feature;

use App\Models\AnneeScolaire;
use App\Models\Filiere;
use App\Models\Groupe;
use App\Models\Module;
use App\Models\Stagiaire;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class Phase2ApisTest extends TestCase
{
    use RefreshDatabase;

    public function test_grades_endpoint_rejects_invalid_grade_range(): void
    {
        $ctx = $this->seedAcademicContext();
        $teacher = User::factory()->create(['role' => 'teacher', 'is_active' => true]);
        $ctx['module']->trainers()->syncWithoutDetaching([$teacher->id]);
        Sanctum::actingAs($teacher);

        $response = $this->postJson('/api/v1/grades', [
            'module_id' => $ctx['module']->id,
            'groupe_id' => $ctx['group']->id,
            'stagiaire_id' => $ctx['stagiaire']->id,
            'valeur' => 25,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['valeur']);
    }

    public function test_grades_endpoint_saves_grade_and_returns_summary_row(): void
    {
        $ctx = $this->seedAcademicContext();
        $teacher = User::factory()->create(['role' => 'teacher', 'is_active' => true]);
        $ctx['module']->trainers()->syncWithoutDetaching([$teacher->id]);
        Sanctum::actingAs($teacher);

        $this->postJson('/api/v1/grades', [
            'module_id' => $ctx['module']->id,
            'groupe_id' => $ctx['group']->id,
            'stagiaire_id' => $ctx['stagiaire']->id,
            'valeur' => 14.5,
        ])->assertOk();

        $this->assertDatabaseHas('notes', [
            'stagiaire_id' => $ctx['stagiaire']->id,
            'valeur' => 14.5,
        ]);

        $summary = $this->getJson('/api/v1/grades?module_id='.$ctx['module']->id.'&groupe_id='.$ctx['group']->id);
        $summary->assertOk();
        $summary->assertJsonPath('data.0.stagiaire_id', $ctx['stagiaire']->id);
        $summary->assertJsonPath('data.0.status', 'Passed');
    }

    public function test_profile_update_changes_identity_and_password_and_avatar(): void
    {
        Storage::fake('public');
        $user = User::factory()->create([
            'role' => 'student',
            'is_active' => true,
            'email' => 'old.profile@test.com',
            'password' => bcrypt('OldPass123'),
        ]);
        Sanctum::actingAs($user);

        $response = $this->post('/api/v1/profile', [
            '_method' => 'PUT',
            'name' => 'Updated Profile',
            'email' => 'new.profile@test.com',
            'password' => 'NewPass123',
            'password_confirmation' => 'NewPass123',
            'avatar' => UploadedFile::fake()->create('avatar.jpg', 64, 'image/jpeg'),
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Updated Profile',
            'email' => 'new.profile@test.com',
        ]);
        $this->assertTrue(password_verify('NewPass123', $user->fresh()->password));
        $this->assertNotNull($user->fresh()->avatar_url);
    }

    public function test_profile_update_rejects_duplicate_email(): void
    {
        $owner = User::factory()->create(['role' => 'student', 'is_active' => true, 'email' => 'owner.profile@test.com']);
        User::factory()->create(['role' => 'teacher', 'is_active' => true, 'email' => 'taken.profile@test.com']);
        Sanctum::actingAs($owner);

        $response = $this->putJson('/api/v1/profile', [
            'name' => 'Owner Profile',
            'email' => 'taken.profile@test.com',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email']);
    }

    public function test_exports_endpoints_stream_valid_csv_files(): void
    {
        $ctx = $this->seedAcademicContext();
        $teacher = User::factory()->create(['role' => 'teacher', 'is_active' => true]);
        Sanctum::actingAs($teacher);

        $studentsCsv = $this->get('/api/v1/exports/students');
        $studentsCsv->assertOk();
        $studentsCsv->assertDownload('students.csv');

        $modulesCsv = $this->get('/api/v1/exports/modules');
        $modulesCsv->assertOk();
        $modulesCsv->assertDownload('modules.csv');

        $gradesCsv = $this->get('/api/v1/exports/grades');
        $gradesCsv->assertOk();
        $gradesCsv->assertDownload('grades.csv');
    }

    public function test_student_cannot_access_exports_endpoints(): void
    {
        $student = User::factory()->create(['role' => 'student', 'is_active' => true]);
        Sanctum::actingAs($student);

        $this->get('/api/v1/exports/students')->assertForbidden();
    }

    public function test_messages_api_supports_conversation_listing_thread_and_read_status(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher', 'is_active' => true]);
        $student = User::factory()->create(['role' => 'student', 'is_active' => true]);

        Sanctum::actingAs($teacher);
        $send = $this->postJson('/api/v1/messages', [
            'receiver_id' => $student->id,
            'content' => 'Hello student',
        ]);
        $send->assertCreated();
        $messageId = (int) $send->json('data.id');

        Sanctum::actingAs($student);
        $conversation = $this->getJson('/api/v1/messages');
        $conversation->assertOk();
        $conversation->assertJsonPath('data.0.peer.id', $teacher->id);

        $thread = $this->getJson('/api/v1/messages?peer_id='.$teacher->id);
        $thread->assertOk();
        $thread->assertJsonPath('data.0.content', 'Hello student');

        $this->postJson('/api/v1/messages/'.$messageId.'/read')->assertOk();
        $this->assertDatabaseMissing('messages', ['id' => $messageId, 'read_at' => null]);
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

        $niveau = \App\Models\Niveau::create([
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
            'name' => 'Student One',
            'email' => 'student.one@test.com',
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

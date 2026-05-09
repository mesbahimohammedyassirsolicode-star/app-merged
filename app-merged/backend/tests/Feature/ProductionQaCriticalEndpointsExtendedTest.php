<?php

namespace Tests\Feature;

use App\Models\AnneeScolaire;
use App\Models\Filiere;
use App\Models\Groupe;
use App\Models\Notification;
use App\Models\Seance;
use App\Models\Stagiaire;
use App\Models\StudentParent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProductionQaCriticalEndpointsExtendedTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_cannot_access_staff_attendance_risk_group_summary(): void
    {
        $ctx = $this->seedAcademicScope();
        Sanctum::actingAs($ctx['student_user']);

        $this->getJson('/api/v1/groups/'.$ctx['group']->id.'/attendance-summary')
            ->assertForbidden();
    }

    public function test_attendance_risk_by_stagiaire_requires_academic_year_parameter(): void
    {
        $ctx = $this->seedAcademicScope();
        Sanctum::actingAs($ctx['student_user']);

        $this->getJson('/api/v1/stagiaires/'.$ctx['stagiaire']->id.'/attendance-summary')
            ->assertStatus(422);
    }

    public function test_parent_cannot_read_non_linked_stagiaire_attendance_risk_summary(): void
    {
        $ctx = $this->seedAcademicScope();
        $parentUser = User::factory()->create([
            'role' => 'parent',
            'is_active' => true,
        ]);
        StudentParent::create([
            'user_id' => $parentUser->id,
            'cin' => 'PA-EXT-001',
            'phone' => '0600000101',
            'address' => 'QA Extended',
        ]);

        Sanctum::actingAs($parentUser);

        $this->getJson('/api/v1/stagiaires/'.$ctx['stagiaire']->id.'/attendance-summary?annee_scolaire_id='.$ctx['year']->id)
            ->assertForbidden();
    }

    public function test_report_endpoint_blocks_student_idor_access_to_other_student(): void
    {
        $ctx = $this->seedAcademicScope();

        $otherUser = User::factory()->create([
            'role' => 'stagiaire',
            'is_active' => true,
        ]);
        $otherStagiaire = Stagiaire::create([
            'user_id' => $otherUser->id,
            'filiere_id' => $ctx['filiere']->id,
            'groupe_id' => $ctx['group']->id,
            'cef_number' => 'CEF-EXT-999',
            'cin' => 'CC123456',
            'date_naissance' => '2003-03-03',
            'status' => 'actif',
        ]);

        Sanctum::actingAs($ctx['student_user']);
        $this->get('/api/v1/students/'.$otherStagiaire->id.'/report')
            ->assertStatus(403);
    }

    public function test_report_endpoint_blocks_parent_access_to_non_linked_child(): void
    {
        $ctx = $this->seedAcademicScope();
        $parentUser = User::factory()->create([
            'role' => 'parent',
            'is_active' => true,
        ]);
        StudentParent::create([
            'user_id' => $parentUser->id,
            'cin' => 'PA-EXT-002',
            'phone' => '0600000102',
            'address' => 'QA Extended',
        ]);

        Sanctum::actingAs($parentUser);
        $this->get('/api/v1/students/'.$ctx['stagiaire']->id.'/report')
            ->assertStatus(403);
    }

    public function test_student_cannot_create_timetable_sessions(): void
    {
        $ctx = $this->seedAcademicScope();
        Sanctum::actingAs($ctx['student_user']);

        $response = $this->postJson('/api/v1/timetable', [
            'date' => '2026-05-10',
            'start_time' => '09:00',
            'end_time' => '11:00',
            'module_id' => 1,
            'groupe_id' => $ctx['group']->id,
            'filiere_id' => $ctx['filiere']->id,
            'status' => 'planned',
            'type' => 'presentiel',
        ]);

        $response->assertForbidden();
    }

    public function test_teacher_cannot_update_other_teachers_timetable_session(): void
    {
        $ctx = $this->seedAcademicScope();
        $teacherOne = User::factory()->create([
            'role' => 'teacher',
            'is_active' => true,
        ]);
        $teacherTwo = User::factory()->create([
            'role' => 'teacher',
            'is_active' => true,
        ]);

        $seance = Seance::create([
            'user_id' => $teacherOne->id,
            'module_id' => null,
            'groupe_id' => $ctx['group']->id,
            'filiere_id' => $ctx['filiere']->id,
            'date' => '2026-05-12',
            'start_time' => '08:30:00',
            'end_time' => '10:30:00',
            'type' => 'presentiel',
            'status' => 'planned',
            'salle' => 'A-10',
        ]);

        Sanctum::actingAs($teacherTwo);
        $this->putJson('/api/v1/timetable/'.$seance->id, [
            'status' => 'planifie',
        ])->assertForbidden();
    }

    public function test_notifications_index_returns_only_authenticated_user_notifications(): void
    {
        $user = User::factory()->create(['role' => 'student', 'is_active' => true]);
        $otherUser = User::factory()->create(['role' => 'student', 'is_active' => true]);

        Notification::create([
            'user_id' => $user->id,
            'title' => 'Own notification',
            'message' => 'Visible to current user',
        ]);
        Notification::create([
            'user_id' => $otherUser->id,
            'title' => 'Other notification',
            'message' => 'Must not leak',
        ]);

        Sanctum::actingAs($user);
        $response = $this->getJson('/api/v1/notifications');

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.user_id', $user->id);
    }

    public function test_notification_mark_as_read_blocks_idor(): void
    {
        $user = User::factory()->create(['role' => 'student', 'is_active' => true]);
        $otherUser = User::factory()->create(['role' => 'student', 'is_active' => true]);

        $otherNotification = Notification::create([
            'user_id' => $otherUser->id,
            'title' => 'Other notification',
            'message' => 'IDOR should be blocked',
        ]);

        Sanctum::actingAs($user);
        $this->postJson('/api/v1/notifications/'.$otherNotification->id.'/read')
            ->assertForbidden();
    }

    public function test_non_admin_cannot_access_admin_parent_linking_endpoints(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher', 'is_active' => true]);
        Sanctum::actingAs($teacher);

        $this->getJson('/api/v1/admin/parent-links/parents')->assertForbidden();
    }

    /**
     * @return array{
     *   year: AnneeScolaire,
     *   filiere: Filiere,
     *   group: Groupe,
     *   student_user: User,
     *   stagiaire: Stagiaire
     * }
     */
    private function seedAcademicScope(): array
    {
        $year = AnneeScolaire::create([
            'year_start' => 2025,
            'year_end' => 2026,
            'label' => '2025-2026',
            'is_current' => true,
            'start_date' => '2025-09-01',
            'end_date' => '2026-06-30',
        ]);

        $filiere = Filiere::create([
            'niveau_id' => null,
            'name' => 'Developpement Digital',
            'label' => 'Developpement Digital',
            'code' => 'DD-EXT',
        ]);

        $group = Groupe::create([
            'niveau_id' => null,
            'filiere_id' => $filiere->id,
            'annee_scolaire_id' => $year->id,
            'name' => 'DD-EXT-01',
            'label' => 'DD-EXT-01',
            'year_level' => 1,
            'capacity' => 30,
        ]);

        $studentUser = User::factory()->create([
            'role' => 'stagiaire',
            'is_active' => true,
        ]);

        $stagiaire = Stagiaire::create([
            'user_id' => $studentUser->id,
            'filiere_id' => $filiere->id,
            'groupe_id' => $group->id,
            'cef_number' => 'CEF-EXT-100',
            'cin' => 'CC000111',
            'date_naissance' => '2004-01-01',
            'status' => 'actif',
        ]);

        return [
            'year' => $year,
            'filiere' => $filiere,
            'group' => $group,
            'student_user' => $studentUser,
            'stagiaire' => $stagiaire,
        ];
    }
}

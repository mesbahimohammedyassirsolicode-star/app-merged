<?php

namespace Tests\Feature;

use App\Models\AnneeScolaire;
use App\Models\Attendance;
use App\Models\Filiere;
use App\Models\Formateur;
use App\Models\Groupe;
use App\Models\Module;
use App\Models\Niveau;
use App\Models\Stagiaire;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AttendanceApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_teacher_can_detect_existing_attendance_session(): void
    {
        $context = $this->seedAttendanceContext();

        Sanctum::actingAs($context['teacher_user']);

        $response = $this->getJson('/api/v1/attendance/sessions/detect?group_id='.$context['group']->id.'&module_id='.$context['module']->id.'&date=2025-10-03');

        $response->assertOk();
        $response->assertJsonPath('data.0.student_id', $context['student_user']->id);
        $response->assertJsonPath('data.0.status', 'present');
    }

    public function test_teacher_cannot_detect_unassigned_group_module(): void
    {
        $context = $this->seedAttendanceContext();
        $otherGroup = Groupe::create([
            'filiere_id' => $context['filiere']->id,
            'annee_scolaire_id' => $context['year']->id,
            'label' => 'DEV-999',
            'year_level' => 1,
            'capacity' => 30,
        ]);

        Sanctum::actingAs($context['teacher_user']);

        $response = $this->getJson('/api/v1/attendance/sessions/detect?group_id='.$otherGroup->id.'&module_id='.$context['module']->id.'&date=2025-10-03');

        $response->assertForbidden();
    }

    public function test_parent_cannot_detect_attendance_session(): void
    {
        $context = $this->seedAttendanceContext();
        $parentUser = User::create([
            'name' => 'Parent User',
            'email' => 'parent.detect@test.com',
            'password' => bcrypt('password'),
            'role' => 'parent',
            'is_active' => true,
        ]);

        Sanctum::actingAs($parentUser);

        $response = $this->getJson('/api/v1/attendance/sessions/detect?group_id='.$context['group']->id.'&module_id='.$context['module']->id.'&date=2025-10-03');

        $response->assertForbidden();
    }

    public function test_teacher_can_bulk_mark_without_module_groupe_when_assigned_via_modal(): void
    {
        $context = $this->seedAttendanceContext(deleteModuleGroupePivot: true);

        Sanctum::actingAs($context['teacher_user']);

        $response = $this->postJson('/api/v1/attendance/sessions', [
            'group_id' => $context['group']->id,
            'module_id' => $context['module']->id,
            'date' => '2025-10-03',
            'academic_year' => '2025-2026',
            'attendances' => [
                [
                    'student_id' => $context['student_user']->id,
                    'status' => 'absent',
                ],
            ],
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.summary.total', 1);

        $this->assertDatabaseHas('attendances', [
            'student_id' => $context['student_user']->id,
            'module_id' => $context['module']->id,
            'group_id' => $context['group']->id,
            'status' => 'absent',
        ]);
    }

    public function test_admin_can_detect_attendance_session(): void
    {
        $context = $this->seedAttendanceContext();
        $admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin.detect@test.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'is_active' => true,
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/attendance/sessions/detect?group_id='.$context['group']->id.'&module_id='.$context['module']->id.'&date=2025-10-03');

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
    }

    /**
     * @param  bool  $deleteModuleGroupePivot  Remove curriculum link to simulate admin-modal-only assignment.
     * @return array{
     *   year: AnneeScolaire,
     *   filiere: Filiere,
     *   group: Groupe,
     *   module: Module,
     *   teacher_user: User,
     *   student_user: User
     * }
     */
    private function seedAttendanceContext(bool $deleteModuleGroupePivot = false): array
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

        $teacherUser = User::create([
            'name' => 'Teacher User',
            'email' => 'teacher.detect@test.com',
            'password' => bcrypt('password'),
            'role' => 'teacher',
            'is_active' => true,
        ]);

        $formateur = Formateur::create([
            'user_id' => $teacherUser->id,
            'matricule' => 'F-100',
            'specialty' => 'Web',
            'type' => 'permanent',
        ]);

        DB::table('teacher_module')->insert([
            'teacher_id' => $formateur->id,
            'module_id' => $module->id,
            'academic_year' => $year->id,
            'semester' => 'S1',
            'weekly_hours' => 4,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('module_groupe')->insert([
            'module_id' => $module->id,
            'groupe_id' => $group->id,
            'academic_year' => $year->id,
            'semester' => 'S1',
            'planned_hours' => 60,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('formateur_module')->insert([
            'user_id' => $teacherUser->id,
            'module_id' => $module->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('formateur_module_group')->insert([
            'user_id' => $teacherUser->id,
            'module_id' => $module->id,
            'groupe_id' => $group->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        if ($deleteModuleGroupePivot) {
            DB::table('module_groupe')
                ->where('module_id', $module->id)
                ->where('groupe_id', $group->id)
                ->delete();
        }

        $studentUser = User::create([
            'name' => 'Student User',
            'email' => 'student.detect@test.com',
            'password' => bcrypt('password'),
            'role' => 'student',
            'is_active' => true,
        ]);

        $stagiaire = Stagiaire::create([
            'user_id' => $studentUser->id,
            'filiere_id' => $filiere->id,
            'groupe_id' => $group->id,
            'cef_number' => 'CEF-100',
            'cin' => 'STU100',
            'date_naissance' => '2004-01-01',
            'status' => 'actif',
        ]);

        $stagiaire->groupes()->attach($group->id);

        Attendance::create([
            'student_id' => $studentUser->id,
            'module_id' => $module->id,
            'group_id' => $group->id,
            'teacher_id' => $teacherUser->id,
            'date' => '2025-10-03',
            'status' => 'present',
            'academic_year' => '2025-2026',
            'created_by' => $teacherUser->id,
        ]);

        return [
            'year' => $year,
            'filiere' => $filiere,
            'group' => $group,
            'module' => $module,
            'teacher_user' => $teacherUser,
            'student_user' => $studentUser,
        ];
    }
}

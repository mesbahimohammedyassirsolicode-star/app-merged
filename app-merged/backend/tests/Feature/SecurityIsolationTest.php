<?php

namespace Tests\Feature;

use App\Models\AnneeScolaire;
use App\Models\Attendance;
use App\Models\Evaluation;
use App\Models\Filiere;
use App\Models\Formateur;
use App\Models\Groupe;
use App\Models\Module;
use App\Models\Niveau;
use App\Models\Note;
use App\Models\Seance;
use App\Models\Stagiaire;
use App\Models\StudentParent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SecurityIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_gets_403_on_teacher_detect_endpoint(): void
    {
        $ctx = $this->seedAcademicContext();
        Sanctum::actingAs($ctx['studentUser']);

        $response = $this->getJson('/api/v1/attendance/sessions/detect?group_id='.$ctx['group']->id.'&module_id='.$ctx['module']->id.'&date=2026-01-15');
        $response->assertForbidden();
    }

    public function test_teacher_only_sees_owned_evaluations(): void
    {
        $ctx = $this->seedAcademicContext();

        $otherTeacher = User::create([
            'name' => 'Other Teacher',
            'email' => 'other.teacher@test.com',
            'password' => bcrypt('password'),
            'role' => 'teacher',
            'is_active' => true,
        ]);
        $otherFormateur = Formateur::create([
            'user_id' => $otherTeacher->id,
            'matricule' => 'F-901',
            'specialty' => 'Math',
            'type' => 'permanent',
        ]);
        Evaluation::create([
            'user_id' => $otherTeacher->id,
            'module_id' => $ctx['module']->id,
            'groupe_id' => $ctx['group']->id,
            'item_label' => 'Other Teacher Eval',
            'type' => 'cc',
            'max_points' => 20,
            'coefficient' => 1,
            'date' => '2026-01-15',
        ]);
        $owned = Evaluation::create([
            'user_id' => $ctx['teacherUser']->id,
            'module_id' => $ctx['module']->id,
            'groupe_id' => $ctx['group']->id,
            'item_label' => 'Owned Eval',
            'type' => 'cc',
            'max_points' => 20,
            'coefficient' => 1,
            'date' => '2026-01-15',
        ]);

        Sanctum::actingAs($ctx['teacherUser']);
        $response = $this->getJson('/api/v1/evaluations');

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.id', $owned->id);
        $response->assertJsonPath('data.0.user_id', $ctx['teacherUser']->id);
    }

    public function test_parent_can_read_only_linked_child_attendance(): void
    {
        $ctx = $this->seedAcademicContext();

        $parentUser = User::create([
            'name' => 'Parent User',
            'email' => 'parent.scope@test.com',
            'password' => bcrypt('password'),
            'role' => 'parent',
            'is_active' => true,
        ]);
        $parent = StudentParent::create([
            'user_id' => $parentUser->id,
            'cin' => 'PA12345',
            'phone' => '0600000000',
            'address' => 'Address',
        ]);

        $parent->stagiaires()->attach($ctx['stagiaire']->id);

        $otherStudentUser = User::create([
            'name' => 'Other Student',
            'email' => 'other.student@test.com',
            'password' => bcrypt('password'),
            'role' => 'student',
            'is_active' => true,
        ]);
        $otherStagiaire = Stagiaire::create([
            'user_id' => $otherStudentUser->id,
            'filiere_id' => $ctx['filiere']->id,
            'groupe_id' => $ctx['group']->id,
            'cef_number' => 'CEF-OTHER',
            'cin' => 'STU999',
            'date_naissance' => '2004-02-02',
            'status' => 'actif',
        ]);

        Attendance::create([
            'student_id' => $ctx['studentUser']->id,
            'module_id' => $ctx['module']->id,
            'group_id' => $ctx['group']->id,
            'teacher_id' => $ctx['teacherUser']->id,
            'date' => '2026-01-15',
            'status' => 'present',
            'academic_year' => '2025-2026',
            'created_by' => $ctx['teacherUser']->id,
        ]);

        Sanctum::actingAs($parentUser);
        $ok = $this->getJson('/api/v1/parent/children/'.$ctx['stagiaire']->id.'/attendance');
        $ok->assertOk();

        $forbidden = $this->getJson('/api/v1/parent/children/'.$otherStagiaire->id.'/attendance');
        $forbidden->assertForbidden();
    }

    public function test_parent_can_read_only_linked_child_details(): void
    {
        $ctx = $this->seedAcademicContext();

        $parentUser = User::create([
            'name' => 'Parent Scope Details',
            'email' => 'parent.details@test.com',
            'password' => bcrypt('password'),
            'role' => 'parent',
            'is_active' => true,
        ]);
        $parent = StudentParent::create([
            'user_id' => $parentUser->id,
            'cin' => 'PA98765',
            'phone' => '0600000001',
            'address' => 'Address',
        ]);
        $parent->stagiaires()->attach($ctx['stagiaire']->id);

        $otherStudentUser = User::create([
            'name' => 'Other Student Details',
            'email' => 'other.student.details@test.com',
            'password' => bcrypt('password'),
            'role' => 'stagiaire',
            'is_active' => true,
        ]);
        $otherStagiaire = Stagiaire::create([
            'user_id' => $otherStudentUser->id,
            'filiere_id' => $ctx['filiere']->id,
            'groupe_id' => $ctx['group']->id,
            'cef_number' => 'CEF-OTHER-DETAILS',
            'cin' => 'STU998',
            'date_naissance' => '2004-02-02',
            'status' => 'actif',
        ]);

        $evaluation = Evaluation::create([
            'user_id' => $ctx['teacherUser']->id,
            'module_id' => $ctx['module']->id,
            'groupe_id' => $ctx['group']->id,
            'item_label' => 'Contract Test',
            'type' => 'cc',
            'max_points' => 20,
            'coefficient' => 1,
            'date' => '2026-01-15',
        ]);
        Note::create([
            'evaluation_id' => $evaluation->id,
            'stagiaire_id' => $ctx['stagiaire']->id,
            'valeur' => 14.5,
            'observation' => 'Good',
        ]);
        Seance::create([
            'user_id' => $ctx['teacherUser']->id,
            'module_id' => $ctx['module']->id,
            'groupe_id' => $ctx['group']->id,
            'filiere_id' => $ctx['filiere']->id,
            'date' => now()->toDateString(),
            'start_time' => '09:00:00',
            'end_time' => '11:00:00',
            'type' => 'presentiel',
            'status' => 'planned',
            'salle' => 'A1',
        ]);

        Sanctum::actingAs($parentUser);
        $ok = $this->getJson('/api/v1/parent/stagiaire/'.$ctx['stagiaire']->id);
        $ok->assertOk();
        $ok->assertJsonPath('data.child.id', $ctx['stagiaire']->id);
        $ok->assertJsonStructure([
            'data' => [
                'child' => ['id', 'name', 'filiere', 'groups'],
                'notes',
                'timetable',
                'absences',
            ],
        ]);

        $forbidden = $this->getJson('/api/v1/parent/stagiaire/'.$otherStagiaire->id);
        $forbidden->assertForbidden();
    }

    public function test_stagiaire_notes_endpoint_returns_only_authenticated_stagiaire_notes(): void
    {
        $ctx = $this->seedAcademicContext();

        $evaluation = Evaluation::create([
            'user_id' => $ctx['teacherUser']->id,
            'module_id' => $ctx['module']->id,
            'groupe_id' => $ctx['group']->id,
            'item_label' => 'Isolation Note Eval',
            'type' => 'cc',
            'max_points' => 20,
            'coefficient' => 1,
            'date' => '2026-01-15',
        ]);

        $ownNote = Note::create([
            'evaluation_id' => $evaluation->id,
            'stagiaire_id' => $ctx['stagiaire']->id,
            'valeur' => 16.0,
            'observation' => 'Own note',
        ]);

        $otherUser = User::create([
            'name' => 'Other Stagiaire Notes',
            'email' => 'other.notes@test.com',
            'password' => bcrypt('password'),
            'role' => 'stagiaire',
            'is_active' => true,
        ]);
        $otherStagiaire = Stagiaire::create([
            'user_id' => $otherUser->id,
            'filiere_id' => $ctx['filiere']->id,
            'groupe_id' => $ctx['group']->id,
            'cef_number' => 'CEF-OTHER-NOTES',
            'cin' => 'STU997',
            'date_naissance' => '2004-03-03',
            'status' => 'actif',
        ]);
        Note::create([
            'evaluation_id' => $evaluation->id,
            'stagiaire_id' => $otherStagiaire->id,
            'valeur' => 8.0,
            'observation' => 'Other note',
        ]);

        Sanctum::actingAs($ctx['studentUser']);
        $response = $this->getJson('/api/v1/stagiaire/notes');

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.id', $ownNote->id);
    }

    public function test_role_isolation_on_parent_and_stagiaire_dashboard_aliases(): void
    {
        $parentUser = User::create([
            'name' => 'Parent Dashboard',
            'email' => 'parent.dashboard@test.com',
            'password' => bcrypt('password'),
            'role' => 'parent',
            'is_active' => true,
        ]);
        StudentParent::create([
            'user_id' => $parentUser->id,
            'cin' => 'PA33333',
            'phone' => '0600000003',
            'address' => 'Address',
        ]);

        $studentUser = User::create([
            'name' => 'Student Dashboard',
            'email' => 'student.dashboard@test.com',
            'password' => bcrypt('password'),
            'role' => 'stagiaire',
            'is_active' => true,
        ]);

        Sanctum::actingAs($parentUser);
        $this->getJson('/api/v1/parent/dashboard')->assertOk();
        $this->getJson('/api/v1/stagiaire/dashboard')->assertForbidden();

        Sanctum::actingAs($studentUser);
        $this->getJson('/api/v1/stagiaire/dashboard')->assertOk();
        $this->getJson('/api/v1/parent/dashboard')->assertForbidden();
    }

    /**
     * @return array{
     *   year: AnneeScolaire,
     *   filiere: Filiere,
     *   group: Groupe,
     *   module: Module,
     *   teacherUser: User,
     *   studentUser: User,
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

        $teacherUser = User::create([
            'name' => 'Teacher User',
            'email' => 'teacher.scope@test.com',
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

        $studentUser = User::create([
            'name' => 'Student User',
            'email' => 'student.scope@test.com',
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

        return [
            'year' => $year,
            'filiere' => $filiere,
            'group' => $group,
            'module' => $module,
            'teacherUser' => $teacherUser,
            'studentUser' => $studentUser,
            'stagiaire' => $stagiaire,
        ];
    }
}

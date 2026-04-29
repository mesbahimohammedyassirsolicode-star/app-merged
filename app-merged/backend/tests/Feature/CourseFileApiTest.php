<?php

namespace Tests\Feature;

use App\Models\AnneeScolaire;
use App\Models\CourseFile;
use App\Models\Filiere;
use App\Models\Formateur;
use App\Models\Groupe;
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

class CourseFileApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_sees_course_file_for_own_group(): void
    {
        $ctx = $this->seedAcademicContext();
        $file = $this->makeCourseFile($ctx['adminUser'], $ctx['group']->id, null);

        Sanctum::actingAs($ctx['studentUser']);
        $res = $this->getJson('/api/v1/course-files');
        $res->assertOk();
        $res->assertJsonPath('success', true);
        $res->assertJsonCount(1, 'data');
        $res->assertJsonPath('data.0.id', $file->id);
    }

    public function test_student_cannot_download_file_for_other_group(): void
    {
        $ctx = $this->seedAcademicContext();

        $otherGroup = Groupe::create([
            'niveau_id' => $ctx['niveau']->id,
            'filiere_id' => $ctx['filiere']->id,
            'annee_scolaire_id' => $ctx['year']->id,
            'name' => 'DD-999',
            'label' => 'DD-999',
            'year_level' => 1,
            'capacity' => 30,
        ]);

        $file = $this->makeCourseFile($ctx['adminUser'], $otherGroup->id, null);

        Sanctum::actingAs($ctx['studentUser']);
        $this->getJson('/api/v1/course-files/'.$file->id.'/download')->assertForbidden();
    }

    public function test_parent_can_list_and_download_child_course_file(): void
    {
        $ctx = $this->seedAcademicContext();

        $parentUser = User::create([
            'name' => 'Parent CF',
            'email' => 'parent.cf@test.com',
            'password' => bcrypt('password'),
            'role' => 'parent',
            'is_active' => true,
        ]);
        $parent = StudentParent::create([
            'user_id' => $parentUser->id,
            'cin' => 'PA99999',
            'phone' => '0600000001',
            'address' => 'Addr',
        ]);
        $parent->stagiaires()->attach($ctx['stagiaire']->id);

        $file = $this->makeCourseFile($ctx['adminUser'], $ctx['group']->id, null);

        Sanctum::actingAs($parentUser);
        $list = $this->getJson('/api/v1/course-files');
        $list->assertOk();
        $list->assertJsonCount(1, 'data');

        $this->getJson('/api/v1/course-files/'.$file->id.'/download')->assertOk();
    }

    public function test_teacher_can_upload_for_assigned_module_and_group(): void
    {
        Storage::fake('course_files');
        $ctx = $this->seedAcademicContext();

        Sanctum::actingAs($ctx['teacherUser']);

        $upload = UploadedFile::fake()->create('notes.pdf', 120, 'application/pdf');

        $res = $this->post('/api/v1/course-files', [
            'file' => $upload,
            'filiere_id' => $ctx['filiere']->id,
            'module_id' => $ctx['module']->id,
            'title' => 'Notes',
        ], [
            'Accept' => 'application/json',
        ]);

        $res->assertCreated();
        $res->assertJsonPath('success', true);
        $this->assertDatabaseHas('course_files', [
            'groupe_id' => null,
            'module_id' => $ctx['module']->id,
            'uploaded_by_user_id' => $ctx['teacherUser']->id,
        ]);
        $path = CourseFile::query()->latest('id')->value('path');
        Storage::disk('course_files')->assertExists($path);
    }

    /**
     * @return array{
     *   year: AnneeScolaire,
     *   niveau: Niveau,
     *   filiere: Filiere,
     *   group: Groupe,
     *   module: Module,
     *   adminUser: User,
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

        $adminUser = User::create([
            'name' => 'Admin CF',
            'email' => 'admin.cf@test.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'is_active' => true,
        ]);

        $teacherUser = User::create([
            'name' => 'Teacher CF',
            'email' => 'teacher.cf@test.com',
            'password' => bcrypt('password'),
            'role' => 'teacher',
            'is_active' => true,
        ]);
        $formateur = Formateur::create([
            'user_id' => $teacherUser->id,
            'matricule' => 'F-CF-1',
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
            'name' => 'Student CF',
            'email' => 'student.cf@test.com',
            'password' => bcrypt('password'),
            'role' => 'student',
            'is_active' => true,
        ]);

        $stagiaire = Stagiaire::create([
            'user_id' => $studentUser->id,
            'filiere_id' => $filiere->id,
            'groupe_id' => $group->id,
            'cef_number' => 'CEF-CF',
            'cin' => 'STU-CF',
            'date_naissance' => '2004-01-01',
            'status' => 'actif',
        ]);
        $stagiaire->groupes()->attach($group->id);

        return [
            'year' => $year,
            'niveau' => $niveau,
            'filiere' => $filiere,
            'group' => $group,
            'module' => $module,
            'adminUser' => $adminUser,
            'teacherUser' => $teacherUser,
            'studentUser' => $studentUser,
            'stagiaire' => $stagiaire,
        ];
    }

    private function makeCourseFile(User $uploader, ?int $groupeId, ?int $moduleId): CourseFile
    {
        Storage::fake('course_files');
        $path = '2026/04/test-'.uniqid('', true).'.pdf';
        Storage::disk('course_files')->put($path, '%PDF-1.4 test');

        return CourseFile::create([
            'uploaded_by_user_id' => $uploader->id,
            'groupe_id' => $groupeId,
            'module_id' => $moduleId,
            'title' => 'Test',
            'original_name' => 'test.pdf',
            'disk' => 'course_files',
            'path' => $path,
            'mime_type' => 'application/pdf',
            'size_bytes' => 12,
        ]);
    }
}

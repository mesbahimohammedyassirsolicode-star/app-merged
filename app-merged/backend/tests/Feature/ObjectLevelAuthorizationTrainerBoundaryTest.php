<?php

namespace Tests\Feature;

use App\Models\AnneeScolaire;
use App\Models\CourseFile;
use App\Models\Filiere;
use App\Models\Formateur;
use App\Models\Groupe;
use App\Models\Module;
use App\Models\Niveau;
use App\Models\Stage;
use App\Models\Stagiaire;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ObjectLevelAuthorizationTrainerBoundaryTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        foreach (glob(database_path('data'.DIRECTORY_SEPARATOR.'z_test_emploi_*.json')) ?: [] as $path) {
            @unlink($path);
        }

        parent::tearDown();
    }

    public function test_trainer_cannot_access_another_trainers_student_report(): void
    {
        $ctx = $this->seedTrainerBoundaryContext();

        Sanctum::actingAs($ctx['trainerBUser']);
        $this->get('/api/v1/students/'.$ctx['stagiaireA']->id.'/report')->assertForbidden();
    }

    public function test_trainer_cannot_view_or_create_another_trainers_stage(): void
    {
        $ctx = $this->seedTrainerBoundaryContext();

        Sanctum::actingAs($ctx['trainerBUser']);

        $this->getJson('/api/v1/stages/'.$ctx['stageA']->id)->assertForbidden();

        $this->postJson('/api/v1/stages', [
            'stagiaire_id' => $ctx['stagiaireA']->id,
            'groupe_id' => $ctx['group']->id,
            'formateur_id' => $ctx['formateurA']->id,
            'organisation' => 'External Corp',
            'poste' => 'Dev',
            'date_debut' => '2026-05-01',
            'date_fin' => '2026-05-30',
        ])->assertForbidden();
    }

    public function test_trainer_cannot_request_timetable_data_for_unassigned_filiere(): void
    {
        $ctx = $this->seedTrainerBoundaryContext();

        Sanctum::actingAs($ctx['trainerBUser']);
        $this->getJson('/api/v1/timetable-data?filiere_code='.$ctx['filiere']->code.'&week_start=2026-05-04')
            ->assertForbidden();
    }

    public function test_trainer_cannot_list_or_upload_course_files_for_another_trainers_module(): void
    {
        Storage::fake('course_files');
        $ctx = $this->seedTrainerBoundaryContext();
        $this->makeCourseFile($ctx['trainerAUser'], $ctx['group']->id, $ctx['moduleA']->id);

        Sanctum::actingAs($ctx['trainerBUser']);

        $this->getJson('/api/v1/course-files?module_id='.$ctx['moduleA']->id)->assertForbidden();

        $this->post('/api/v1/course-files', [
            'file' => UploadedFile::fake()->create('notes.pdf', 20, 'application/pdf'),
            'filiere_id' => $ctx['filiere']->id,
            'module_id' => $ctx['moduleA']->id,
            'title' => 'Attempted upload',
        ], [
            'Accept' => 'application/json',
        ])->assertForbidden();
    }

    private function seedTrainerBoundaryContext(): array
    {
        $year = AnneeScolaire::create([
            'year_start' => 2025,
            'year_end' => 2026,
            'label' => '2025-2026',
            'is_current' => true,
            'start_date' => '2025-09-01',
            'end_date' => '2026-06-30',
        ]);
        $niveau = Niveau::create(['name' => 'TS', 'label' => 'TS', 'code' => 'TS']);
        $filiere = Filiere::create([
            'niveau_id' => $niveau->id,
            'name' => 'Developpement Digital',
            'label' => 'Developpement Digital',
            'code' => 'DD-SEC',
        ]);
        $group = Groupe::create([
            'niveau_id' => $niveau->id,
            'filiere_id' => $filiere->id,
            'annee_scolaire_id' => $year->id,
            'name' => 'DD-SEC-01',
            'label' => 'DD-SEC-01',
            'year_level' => 1,
            'capacity' => 30,
        ]);

        $trainerAUser = User::factory()->create(['role' => 'teacher', 'is_active' => true]);
        $trainerBUser = User::factory()->create(['role' => 'teacher', 'is_active' => true]);
        $formateurA = Formateur::create(['user_id' => $trainerAUser->id, 'matricule' => 'FA-1', 'specialty' => 'Web', 'type' => 'permanent']);
        $formateurB = Formateur::create(['user_id' => $trainerBUser->id, 'matricule' => 'FB-1', 'specialty' => 'Web', 'type' => 'permanent']);

        $moduleA = Module::create([
            'niveau_id' => $niveau->id,
            'filiere_id' => $filiere->id,
            'code' => 'MOD-A',
            'name' => 'Laravel Security',
            'label' => 'Laravel Security',
            'masse_horaire' => 40,
            'coefficient' => 2,
            'semester' => 'S1',
        ]);

        DB::table('teacher_module')->insert([
            'teacher_id' => $formateurA->id,
            'module_id' => $moduleA->id,
            'academic_year' => $year->id,
            'semester' => 'S1',
            'weekly_hours' => 4,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $studentUser = User::factory()->create(['role' => 'stagiaire', 'is_active' => true]);
        $stagiaireA = Stagiaire::create([
            'user_id' => $studentUser->id,
            'filiere_id' => $filiere->id,
            'groupe_id' => $group->id,
            'cef_number' => 'CEF-SEC-1',
            'cin' => 'CC998877',
            'date_naissance' => '2004-01-01',
            'status' => 'actif',
        ]);
        $stagiaireA->groupes()->attach($group->id);

        $stageA = Stage::create([
            'stagiaire_id' => $stagiaireA->id,
            'groupe_id' => $group->id,
            'formateur_id' => $formateurA->id,
            'organisation' => 'Org A',
            'poste' => 'Dev',
            'date_debut' => '2026-04-01',
            'date_fin' => '2026-05-01',
            'status' => 'en_cours',
        ]);

        $this->writeTimetableFixture($filiere->code);

        return compact(
            'year',
            'filiere',
            'group',
            'trainerAUser',
            'trainerBUser',
            'formateurA',
            'formateurB',
            'moduleA',
            'stagiaireA',
            'stageA'
        );
    }

    private function writeTimetableFixture(string $filiereCode): void
    {
        $dir = database_path('data');
        if (! is_dir($dir)) {
            mkdir($dir, 0777, true);
        }
        $path = $dir.DIRECTORY_SEPARATOR.'z_test_emploi_'.$filiereCode.'.json';
        File::put($path, json_encode([
            'meta' => [
                'filiere_code' => $filiereCode,
                'filiere_label' => 'Test Filiere',
                'group_label' => 'DD-SEC-01',
            ],
            'time_slots' => [],
            'seances' => [
                [
                    'day' => 'monday',
                    'start' => '08:30',
                    'end' => '10:30',
                    'module_code' => 'MOD-A',
                    'module_label' => 'Laravel Security',
                    'teacher' => 'Trainer A',
                ],
            ],
        ], JSON_THROW_ON_ERROR));
    }

    private function makeCourseFile(User $uploader, ?int $groupeId, ?int $moduleId): CourseFile
    {
        $path = '2026/05/test-'.uniqid('', true).'.pdf';
        Storage::disk('course_files')->put($path, '%PDF-1.4 test');

        return CourseFile::create([
            'uploaded_by_user_id' => $uploader->id,
            'groupe_id' => $groupeId,
            'module_id' => $moduleId,
            'title' => 'Security Test',
            'original_name' => 'security-test.pdf',
            'disk' => 'course_files',
            'path' => $path,
            'mime_type' => 'application/pdf',
            'size_bytes' => 12,
        ]);
    }
}

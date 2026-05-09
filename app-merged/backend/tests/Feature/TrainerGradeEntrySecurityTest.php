<?php

namespace Tests\Feature;

use App\Models\AnneeScolaire;
use App\Models\Filiere;
use App\Models\Groupe;
use App\Models\Module;
use App\Models\Niveau;
use App\Models\Stagiaire;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TrainerGradeEntrySecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_grade_entry_data_is_strictly_scoped_to_trainer_assignments(): void
    {
        $ctx = $this->seedContext();

        Sanctum::actingAs($ctx['trainer']);

        $response = $this->getJson('/api/v1/trainer/grade-entry-data');

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.filiere_id', $ctx['allowedFiliere']->id);
        $response->assertJsonPath('data.0.groups.0.group_id', $ctx['allowedGroup']->id);
        $response->assertJsonPath('data.0.groups.0.modules.0.module_id', $ctx['allowedModule']->id);

        $json = $response->json('data');
        $this->assertStringNotContainsString((string) $ctx['forbiddenFiliere']->id, json_encode($json));
        $this->assertStringNotContainsString((string) $ctx['forbiddenModule']->id, json_encode($json));
        $this->assertStringNotContainsString((string) $ctx['forbiddenStudent']->id, json_encode($json));
    }

    public function test_batch_save_returns_403_when_one_module_is_not_owned_by_trainer(): void
    {
        $ctx = $this->seedContext();

        Sanctum::actingAs($ctx['trainer']);

        $response = $this->postJson('/api/v1/trainer/grades', [
            'entries' => [
                [
                    'module_id' => $ctx['allowedModule']->id,
                    'student_id' => $ctx['allowedStudent']->id,
                    'grade' => 14.50,
                ],
                [
                    'module_id' => $ctx['forbiddenModule']->id,
                    'student_id' => $ctx['forbiddenStudent']->id,
                    'grade' => 12.00,
                ],
            ],
        ]);

        $response->assertForbidden();
        $this->assertDatabaseCount('notes', 0);
    }

    public function test_batch_validation_returns_entry_scoped_422_errors(): void
    {
        $ctx = $this->seedContext();

        Sanctum::actingAs($ctx['trainer']);

        $response = $this->postJson('/api/v1/trainer/grades', [
            'entries' => [
                [
                    'module_id' => $ctx['allowedModule']->id,
                    'student_id' => $ctx['allowedStudent']->id,
                    'grade' => 21,
                ],
            ],
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['entries.0.grade']);
    }

    /**
     * @return array{
     *   trainer:User,
     *   allowedFiliere:Filiere,
     *   allowedGroup:Groupe,
     *   allowedModule:Module,
     *   allowedStudent:Stagiaire,
     *   forbiddenFiliere:Filiere,
     *   forbiddenModule:Module,
     *   forbiddenStudent:Stagiaire
     * }
     */
    private function seedContext(): array
    {
        $year = AnneeScolaire::query()->create([
            'year_start' => 2025,
            'year_end' => 2026,
            'label' => '2025-2026',
            'is_current' => true,
            'start_date' => '2025-09-01',
            'end_date' => '2026-06-30',
        ]);

        $niveau = Niveau::query()->create([
            'name' => 'TS',
            'label' => 'TS',
            'code' => 'TS',
        ]);

        $allowedFiliere = Filiere::query()->create([
            'niveau_id' => $niveau->id,
            'name' => 'Allowed Filiere',
            'label' => 'Allowed Filiere',
            'code' => 'AF',
        ]);

        $forbiddenFiliere = Filiere::query()->create([
            'niveau_id' => $niveau->id,
            'name' => 'Forbidden Filiere',
            'label' => 'Forbidden Filiere',
            'code' => 'FF',
        ]);

        $allowedGroup = Groupe::query()->create([
            'niveau_id' => $niveau->id,
            'filiere_id' => $allowedFiliere->id,
            'annee_scolaire_id' => $year->id,
            'label' => 'G-ALLOWED',
            'year_level' => 1,
            'capacity' => 25,
        ]);

        $forbiddenGroup = Groupe::query()->create([
            'niveau_id' => $niveau->id,
            'filiere_id' => $forbiddenFiliere->id,
            'annee_scolaire_id' => $year->id,
            'label' => 'G-FORBIDDEN',
            'year_level' => 1,
            'capacity' => 25,
        ]);

        $allowedModule = Module::query()->create([
            'niveau_id' => $niveau->id,
            'filiere_id' => $allowedFiliere->id,
            'code' => 'M-ALLOW',
            'name' => 'Allowed Module',
            'label' => 'Allowed Module',
            'masse_horaire' => 30,
            'coefficient' => 1,
            'semester' => 'S1',
        ]);

        $forbiddenModule = Module::query()->create([
            'niveau_id' => $niveau->id,
            'filiere_id' => $forbiddenFiliere->id,
            'code' => 'M-FORBID',
            'name' => 'Forbidden Module',
            'label' => 'Forbidden Module',
            'masse_horaire' => 30,
            'coefficient' => 1,
            'semester' => 'S1',
        ]);

        DB::table('module_groupe')->insert([
            [
                'module_id' => $allowedModule->id,
                'groupe_id' => $allowedGroup->id,
                'academic_year' => $year->id,
                'semester' => 'S1',
                'planned_hours' => 20,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'module_id' => $forbiddenModule->id,
                'groupe_id' => $forbiddenGroup->id,
                'academic_year' => $year->id,
                'semester' => 'S1',
                'planned_hours' => 20,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        $trainer = User::query()->create([
            'name' => 'Scoped Trainer',
            'email' => 'trainer.grade.scope@test.com',
            'password' => bcrypt('password'),
            'role' => 'formateur',
            'is_active' => true,
        ]);

        DB::table('module_trainer')->insert([
            'user_id' => $trainer->id,
            'module_id' => $allowedModule->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $allowedStudentUser = User::query()->create([
            'name' => 'Allowed Student',
            'email' => 'allowed.student.grade.scope@test.com',
            'password' => bcrypt('password'),
            'role' => 'stagiaire',
            'is_active' => true,
        ]);

        $forbiddenStudentUser = User::query()->create([
            'name' => 'Forbidden Student',
            'email' => 'forbidden.student.grade.scope@test.com',
            'password' => bcrypt('password'),
            'role' => 'stagiaire',
            'is_active' => true,
        ]);

        $allowedStudent = Stagiaire::query()->create([
            'user_id' => $allowedStudentUser->id,
            'filiere_id' => $allowedFiliere->id,
            'groupe_id' => $allowedGroup->id,
            'cef_number' => 'CEF-ALLOW',
            'cin' => 'CIN-ALLOW',
            'date_naissance' => '2004-01-01',
            'status' => 'actif',
        ]);

        $forbiddenStudent = Stagiaire::query()->create([
            'user_id' => $forbiddenStudentUser->id,
            'filiere_id' => $forbiddenFiliere->id,
            'groupe_id' => $forbiddenGroup->id,
            'cef_number' => 'CEF-FORBID',
            'cin' => 'CIN-FORBID',
            'date_naissance' => '2004-01-01',
            'status' => 'actif',
        ]);

        return [
            'trainer' => $trainer,
            'allowedFiliere' => $allowedFiliere,
            'allowedGroup' => $allowedGroup,
            'allowedModule' => $allowedModule,
            'allowedStudent' => $allowedStudent,
            'forbiddenFiliere' => $forbiddenFiliere,
            'forbiddenModule' => $forbiddenModule,
            'forbiddenStudent' => $forbiddenStudent,
        ];
    }
}

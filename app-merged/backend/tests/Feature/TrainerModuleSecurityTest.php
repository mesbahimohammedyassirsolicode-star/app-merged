<?php

namespace Tests\Feature;

use App\Models\Filiere;
use App\Models\Groupe;
use App\Models\Module;
use App\Models\Niveau;
use App\Models\AnneeScolaire;
use App\Models\Stagiaire;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TrainerModuleSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_trainer_modules_endpoint_returns_only_assigned_modules(): void
    {
        $ctx = $this->seedTrainerScopeContext();

        Sanctum::actingAs($ctx['trainer']);
        $response = $this->getJson('/api/v1/trainer/modules');

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.id', $ctx['allowedModule']->id);
    }

    public function test_trainer_cannot_submit_grade_for_unassigned_module(): void
    {
        $ctx = $this->seedTrainerScopeContext();

        Sanctum::actingAs($ctx['trainer']);
        $response = $this->postJson('/api/v1/grades', [
            'module_id' => $ctx['forbiddenModule']->id,
            'groupe_id' => $ctx['groupe']->id,
            'stagiaire_id' => $ctx['stagiaire']->id,
            'valeur' => 14,
        ]);

        $response->assertForbidden();
    }

    /**
     * @return array{trainer:User,allowedModule:Module,forbiddenModule:Module,groupe:Groupe,stagiaire:Stagiaire}
     */
    private function seedTrainerScopeContext(): array
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

        $filiere = Filiere::query()->create([
            'niveau_id' => $niveau->id,
            'name' => 'DD',
            'label' => 'DD',
            'code' => 'DD',
        ]);

        $groupe = Groupe::query()->create([
            'niveau_id' => $niveau->id,
            'filiere_id' => $filiere->id,
            'annee_scolaire_id' => $year->id,
            'label' => 'G1',
            'year_level' => 1,
            'capacity' => 20,
        ]);

        $allowedModule = Module::query()->create([
            'niveau_id' => $niveau->id,
            'filiere_id' => $filiere->id,
            'code' => 'M-ALLOWED',
            'name' => 'Allowed',
            'label' => 'Allowed',
            'masse_horaire' => 30,
            'coefficient' => 1,
            'semester' => 'S1',
        ]);

        $forbiddenModule = Module::query()->create([
            'niveau_id' => $niveau->id,
            'filiere_id' => $filiere->id,
            'code' => 'M-FORBIDDEN',
            'name' => 'Forbidden',
            'label' => 'Forbidden',
            'masse_horaire' => 30,
            'coefficient' => 1,
            'semester' => 'S1',
        ]);

        $trainer = User::query()->create([
            'name' => 'Trainer',
            'email' => 'trainer.scope@test.com',
            'password' => bcrypt('password'),
            'role' => 'formateur',
            'is_active' => true,
        ]);

        $studentUser = User::query()->create([
            'name' => 'Student',
            'email' => 'student.scope.grades@test.com',
            'password' => bcrypt('password'),
            'role' => 'stagiaire',
            'is_active' => true,
        ]);

        $stagiaire = Stagiaire::query()->create([
            'user_id' => $studentUser->id,
            'filiere_id' => $filiere->id,
            'groupe_id' => $groupe->id,
            'cef_number' => 'CEF-SEC-1',
            'cin' => 'CIN-SEC-1',
            'date_naissance' => '2004-01-01',
            'status' => 'actif',
        ]);

        DB::table('module_groupe')->insert([
            'module_id' => $allowedModule->id,
            'groupe_id' => $groupe->id,
            'academic_year' => $year->id,
            'semester' => 'S1',
            'planned_hours' => 20,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('module_groupe')->insert([
            'module_id' => $forbiddenModule->id,
            'groupe_id' => $groupe->id,
            'academic_year' => $year->id,
            'semester' => 'S1',
            'planned_hours' => 20,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('module_trainer')->insert([
            'user_id' => $trainer->id,
            'module_id' => $allowedModule->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return [
            'trainer' => $trainer,
            'allowedModule' => $allowedModule,
            'forbiddenModule' => $forbiddenModule,
            'groupe' => $groupe,
            'stagiaire' => $stagiaire,
        ];
    }
}


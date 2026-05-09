<?php

namespace Tests\Feature;

use App\Models\Filiere;
use App\Models\Formateur;
use App\Models\Module;
use App\Models\Niveau;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class HealthTest extends TestCase
{
    use RefreshDatabase;

    public function test_health_returns_200_when_database_ok(): void
    {
        $response = $this->getJson('/api/v1/health');

        $response->assertStatus(200);
        $response->assertJsonPath('data.status', 'healthy');
        $response->assertJsonPath('data.checks.app', 'ok');
        $response->assertJsonPath('data.checks.database', 'ok');
    }

    public function test_trainer_assignments_health_returns_ready_when_assignment_exists(): void
    {
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

        $module = Module::query()->create([
            'niveau_id' => $niveau->id,
            'filiere_id' => $filiere->id,
            'code' => 'M-HEALTH',
            'name' => 'Health module',
            'label' => 'Health module',
            'masse_horaire' => 20,
            'coefficient' => 1,
            'semester' => 'S1',
        ]);

        $user = User::query()->create([
            'name' => 'Trainer Health',
            'email' => 'trainer.health@test.com',
            'password' => bcrypt('password'),
            'role' => 'formateur',
            'is_active' => true,
        ]);

        Formateur::query()->create([
            'user_id' => $user->id,
            'matricule' => 'FH-1',
            'specialty' => 'Web',
            'type' => 'permanent',
            'filiere_id' => $filiere->id,
        ]);

        DB::table('module_trainer')->insert([
            'user_id' => $user->id,
            'module_id' => $module->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->getJson('/api/v1/health/trainer-assignments');

        $response->assertStatus(200);
        $response->assertJsonPath('data.status', 'ready');
        $response->assertJsonPath('data.checks.schema', 'ok');
        $response->assertJsonPath('data.checks.assignments', 'ok');
    }
}

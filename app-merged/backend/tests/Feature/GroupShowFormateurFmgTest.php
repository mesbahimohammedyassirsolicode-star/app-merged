<?php

namespace Tests\Feature;

use App\Models\AnneeScolaire;
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

class GroupShowFormateurFmgTest extends TestCase
{
    use RefreshDatabase;

    public function test_formateur_can_view_group_detail_when_assigned_only_via_formateur_module_group(): void
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
            'name' => 'F',
            'label' => 'F',
            'code' => 'F',
        ]);

        $group = Groupe::query()->create([
            'niveau_id' => $niveau->id,
            'filiere_id' => $filiere->id,
            'annee_scolaire_id' => $year->id,
            'label' => 'TSGE-FMG',
            'year_level' => 1,
            'capacity' => 30,
        ]);

        $module = Module::query()->create([
            'niveau_id' => $niveau->id,
            'filiere_id' => $filiere->id,
            'code' => 'M-FMG',
            'name' => 'Mod',
            'label' => 'Mod',
            'masse_horaire' => 30,
            'coefficient' => 1,
            'semester' => 'S1',
        ]);

        $teacher = User::query()->create([
            'name' => 'Formateur FMG',
            'email' => 'formateur.fmg.show@test.com',
            'password' => bcrypt('secret'),
            'role' => 'formateur',
            'is_active' => true,
        ]);

        Formateur::query()->create([
            'user_id' => $teacher->id,
            'matricule' => 'FMG-SHOW',
            'specialty' => 'x',
            'type' => 'permanent',
            'filiere_id' => $filiere->id,
        ]);

        DB::table('formateur_module')->insert([
            'user_id' => $teacher->id,
            'module_id' => $module->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('formateur_module_group')->insert([
            'user_id' => $teacher->id,
            'module_id' => $module->id,
            'groupe_id' => $group->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $studentUser = User::query()->create([
            'name' => 'Student One',
            'email' => 'student.fmg.show@test.com',
            'password' => bcrypt('secret'),
            'role' => 'student',
            'is_active' => true,
        ]);

        Stagiaire::query()->create([
            'user_id' => $studentUser->id,
            'filiere_id' => $filiere->id,
            'groupe_id' => $group->id,
            'cef_number' => 'CEF-FMG-1',
            'cin' => 'AB111111',
            'date_naissance' => '2005-01-01',
            'status' => 'actif',
        ]);

        Sanctum::actingAs($teacher);

        $response = $this->getJson('/api/v1/groups/'.$group->id);

        $response->assertOk();
        $response->assertJsonPath('success', true);
        $response->assertJsonCount(1, 'data.stagiaires');
    }
}

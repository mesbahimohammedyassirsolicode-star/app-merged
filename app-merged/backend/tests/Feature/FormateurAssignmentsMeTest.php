<?php

namespace Tests\Feature;

use App\Models\AnneeScolaire;
use App\Models\Filiere;
use App\Models\Formateur;
use App\Models\Groupe;
use App\Models\Module;
use App\Models\Niveau;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class FormateurAssignmentsMeTest extends TestCase
{
    use RefreshDatabase;

    public function test_me_returns_only_groupes_from_formateur_module_group_when_present(): void
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

        $gA = Groupe::query()->create([
            'niveau_id' => $niveau->id,
            'filiere_id' => $filiere->id,
            'annee_scolaire_id' => $year->id,
            'label' => 'GA',
            'year_level' => 1,
            'capacity' => 20,
        ]);

        $gB = Groupe::query()->create([
            'niveau_id' => $niveau->id,
            'filiere_id' => $filiere->id,
            'annee_scolaire_id' => $year->id,
            'label' => 'GB',
            'year_level' => 1,
            'capacity' => 20,
        ]);

        $module = Module::query()->create([
            'niveau_id' => $niveau->id,
            'filiere_id' => $filiere->id,
            'code' => 'M1',
            'name' => 'Mod',
            'label' => 'Mod',
            'masse_horaire' => 30,
            'coefficient' => 1,
            'semester' => 'S1',
        ]);

        $user = User::query()->create([
            'name' => 'T',
            'email' => 't.me-scope@test.com',
            'password' => bcrypt('x'),
            'role' => 'formateur',
            'is_active' => true,
        ]);

        $formateur = Formateur::query()->create([
            'user_id' => $user->id,
            'matricule' => 'M-1',
            'specialty' => 'x',
            'type' => 'permanent',
            'filiere_id' => $filiere->id,
        ]);

        DB::table('teacher_module')->insert([
            'teacher_id' => $formateur->id,
            'module_id' => $module->id,
            'academic_year' => $year->id,
            'semester' => 'S1',
            'weekly_hours' => 2,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        foreach ([$gA->id, $gB->id] as $gid) {
            DB::table('module_groupe')->insert([
                'module_id' => $module->id,
                'groupe_id' => $gid,
                'academic_year' => $year->id,
                'semester' => 'S1',
                'planned_hours' => 30,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        DB::table('formateur_module_group')->insert([
            'user_id' => $user->id,
            'module_id' => $module->id,
            'groupe_id' => $gA->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/formateur-assignments/me?academic_year='.$year->id);

        $response->assertOk();
        $response->assertJsonPath('data.modules.0.groupes.0.id', $gA->id);
        $response->assertJsonCount(1, 'data.modules.0.groupes');
    }

    public function test_me_includes_formateur_module_when_teacher_module_missing(): void
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
            'label' => 'G1',
            'year_level' => 1,
            'capacity' => 20,
        ]);

        $module = Module::query()->create([
            'niveau_id' => $niveau->id,
            'filiere_id' => $filiere->id,
            'code' => 'M-LEG',
            'name' => 'Legacy mod',
            'label' => 'Legacy mod',
            'masse_horaire' => 30,
            'coefficient' => 1,
            'semester' => 'S1',
        ]);

        $user = User::query()->create([
            'name' => 'Legacy Formateur',
            'email' => 'legacy.me@test.com',
            'password' => bcrypt('x'),
            'role' => 'formateur',
            'is_active' => true,
        ]);

        Formateur::query()->create([
            'user_id' => $user->id,
            'matricule' => 'M-LEG-F',
            'specialty' => 'x',
            'type' => 'permanent',
            'filiere_id' => $filiere->id,
        ]);

        DB::table('formateur_module')->insert([
            'user_id' => $user->id,
            'module_id' => $module->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('module_groupe')->insert([
            'module_id' => $module->id,
            'groupe_id' => $group->id,
            'academic_year' => $year->id,
            'semester' => 'S1',
            'planned_hours' => 30,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/formateur-assignments/me?academic_year='.$year->id);

        $response->assertOk();
        $response->assertJsonPath('data.modules.0.id', $module->id);
        $response->assertJsonPath('data.modules.0.groupes.0.id', $group->id);
    }

    public function test_me_returns_groupes_from_formateur_module_group_when_module_groupe_missing(): void
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
            'label' => 'G-NOMOD',
            'year_level' => 1,
            'capacity' => 20,
        ]);

        $module = Module::query()->create([
            'niveau_id' => $niveau->id,
            'filiere_id' => $filiere->id,
            'code' => 'M-NOMOD',
            'name' => 'No module_groupe',
            'label' => 'No module_groupe',
            'masse_horaire' => 30,
            'coefficient' => 1,
            'semester' => 'S1',
        ]);

        $user = User::query()->create([
            'name' => 'FMG only',
            'email' => 'fmg.only@test.com',
            'password' => bcrypt('x'),
            'role' => 'formateur',
            'is_active' => true,
        ]);

        Formateur::query()->create([
            'user_id' => $user->id,
            'matricule' => 'M-FMG-O',
            'specialty' => 'x',
            'type' => 'permanent',
            'filiere_id' => $filiere->id,
        ]);

        DB::table('formateur_module')->insert([
            'user_id' => $user->id,
            'module_id' => $module->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('formateur_module_group')->insert([
            'user_id' => $user->id,
            'module_id' => $module->id,
            'groupe_id' => $group->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/formateur-assignments/me?academic_year='.$year->id);

        $response->assertOk();
        $response->assertJsonPath('data.modules.0.id', $module->id);
        $response->assertJsonPath('data.modules.0.groupes.0.id', $group->id);
        $response->assertJsonCount(1, 'data.modules.0.groupes');
    }

    public function test_me_resolves_academic_year_from_date_when_is_current_points_elsewhere(): void
    {
        $yearStale = AnneeScolaire::query()->create([
            'year_start' => 2024,
            'year_end' => 2025,
            'label' => '2024-2025',
            'is_current' => true,
            'start_date' => '2024-09-01',
            'end_date' => '2025-06-30',
        ]);

        $yearActive = AnneeScolaire::query()->create([
            'year_start' => 2025,
            'year_end' => 2026,
            'label' => '2025-2026',
            'is_current' => false,
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

        $groupeStale = Groupe::query()->create([
            'niveau_id' => $niveau->id,
            'filiere_id' => $filiere->id,
            'annee_scolaire_id' => $yearStale->id,
            'label' => 'G-stale',
            'year_level' => 1,
            'capacity' => 20,
        ]);

        $groupeActive = Groupe::query()->create([
            'niveau_id' => $niveau->id,
            'filiere_id' => $filiere->id,
            'annee_scolaire_id' => $yearActive->id,
            'label' => 'G-active',
            'year_level' => 1,
            'capacity' => 20,
        ]);

        $moduleStale = Module::query()->create([
            'niveau_id' => $niveau->id,
            'filiere_id' => $filiere->id,
            'code' => 'M-OLD',
            'name' => 'Old',
            'label' => 'Old',
            'masse_horaire' => 30,
            'coefficient' => 1,
            'semester' => 'S1',
        ]);

        $moduleActive = Module::query()->create([
            'niveau_id' => $niveau->id,
            'filiere_id' => $filiere->id,
            'code' => 'M-NEW',
            'name' => 'New',
            'label' => 'New',
            'masse_horaire' => 30,
            'coefficient' => 1,
            'semester' => 'S1',
        ]);

        $user = User::query()->create([
            'name' => 'T2',
            'email' => 't2.me-date@test.com',
            'password' => bcrypt('x'),
            'role' => 'formateur',
            'is_active' => true,
        ]);

        $formateur = Formateur::query()->create([
            'user_id' => $user->id,
            'matricule' => 'M-2',
            'specialty' => 'x',
            'type' => 'permanent',
            'filiere_id' => $filiere->id,
        ]);

        foreach ([
            [$moduleStale->id, $yearStale->id, $groupeStale->id],
            [$moduleActive->id, $yearActive->id, $groupeActive->id],
        ] as [$mid, $yid, $gid]) {
            DB::table('teacher_module')->insert([
                'teacher_id' => $formateur->id,
                'module_id' => $mid,
                'academic_year' => $yid,
                'semester' => 'S1',
                'weekly_hours' => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            DB::table('module_groupe')->insert([
                'module_id' => $mid,
                'groupe_id' => $gid,
                'academic_year' => $yid,
                'semester' => 'S1',
                'planned_hours' => 30,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        Sanctum::actingAs($user);

        $byCurrentFlag = $this->getJson('/api/v1/formateur-assignments/me');
        $byCurrentFlag->assertOk();
        $byCurrentFlag->assertJsonPath('data.academic_year', $yearStale->id);
        $byCurrentFlag->assertJsonCount(1, 'data.modules');
        $byCurrentFlag->assertJsonPath('data.modules.0.id', $moduleStale->id);

        $withDate = $this->getJson('/api/v1/formateur-assignments/me?date=2025-10-08');
        $withDate->assertOk();
        $withDate->assertJsonPath('data.academic_year', $yearActive->id);
        $withDate->assertJsonCount(1, 'data.modules');
        $withDate->assertJsonPath('data.modules.0.id', $moduleActive->id);
    }
}

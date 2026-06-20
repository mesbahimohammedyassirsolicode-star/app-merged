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

class FiliereGroupStandardizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_rebuild_filiere_groups_and_remap_links(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'is_active' => true,
        ]);

        Sanctum::actingAs($admin);

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
            'name' => 'Développement Digital',
            'label' => 'Développement Digital',
            'code' => 'DD',
        ]);

        $legacyYearOne = Groupe::query()->create([
            'niveau_id' => $niveau->id,
            'filiere_id' => $filiere->id,
            'annee_scolaire_id' => $year->id,
            'label' => 'DD Legacy A',
            'name' => 'DD Legacy A',
            'year_level' => 1,
            'capacity' => 28,
        ]);

        $legacyYearTwo = Groupe::query()->create([
            'niveau_id' => $niveau->id,
            'filiere_id' => $filiere->id,
            'annee_scolaire_id' => $year->id,
            'label' => 'DD Legacy B',
            'name' => 'DD Legacy B',
            'year_level' => 2,
            'capacity' => 32,
        ]);

        $moduleYearOne = Module::query()->create([
            'niveau_id' => $niveau->id,
            'filiere_id' => $filiere->id,
            'code' => 'ALG-S1',
            'name' => 'Algorithmique',
            'label' => 'Algorithmique',
            'masse_horaire' => 40,
            'coefficient' => 2,
            'semester' => 'S1',
        ]);

        $moduleYearTwo = Module::query()->create([
            'niveau_id' => $niveau->id,
            'filiere_id' => $filiere->id,
            'code' => 'API-S4',
            'name' => 'API avancée',
            'label' => 'API avancée',
            'masse_horaire' => 42,
            'coefficient' => 2,
            'semester' => 'S4',
        ]);

        $ambiguousModule = Module::query()->create([
            'niveau_id' => $niveau->id,
            'filiere_id' => $filiere->id,
            'code' => 'CG-001',
            'name' => 'Culture générale',
            'label' => 'Culture générale',
            'masse_horaire' => 20,
            'coefficient' => 1,
            'semester' => null,
        ]);

        foreach ([
            [$moduleYearOne, $legacyYearOne, 'S1', 40],
            [$moduleYearTwo, $legacyYearTwo, 'S4', 42],
            [$ambiguousModule, $legacyYearOne, null, 20],
        ] as [$module, $group, $semester, $hours]) {
            DB::table('module_groupe')->insert([
                'module_id' => $module->id,
                'groupe_id' => $group->id,
                'academic_year' => $year->id,
                'semester' => $semester,
                'planned_hours' => $hours,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $studentUser = User::factory()->create([
            'role' => 'stagiaire',
            'is_active' => true,
        ]);

        $stagiaire = Stagiaire::query()->create([
            'user_id' => $studentUser->id,
            'filiere_id' => $filiere->id,
            'groupe_id' => $legacyYearOne->id,
            'cef_number' => 'CEF-STANDARDIZE',
            'cin' => 'CIN-STANDARDIZE',
            'date_naissance' => '2005-01-01',
            'status' => 'actif',
        ]);

        DB::table('groupe_stagiaire')->insert([
            'groupe_id' => $legacyYearOne->id,
            'stagiaire_id' => $stagiaire->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $trainer = User::factory()->create([
            'role' => 'formateur',
            'is_active' => true,
        ]);

        DB::table('formateur_group')->insert([
            'user_id' => $trainer->id,
            'groupe_id' => $legacyYearOne->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('formateur_module_group')->insert([
            'user_id' => $trainer->id,
            'module_id' => $moduleYearOne->id,
            'groupe_id' => $legacyYearOne->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->postJson("/api/v1/academic-structure/filieres/{$filiere->id}/standardize-groups");

        $response->assertOk();
        $response->assertJsonPath('data.created_groups.0.label', '1ère année');
        $response->assertJsonPath('data.created_groups.1.label', '2ème année');

        $activeGroups = Groupe::query()
            ->where('filiere_id', $filiere->id)
            ->orderBy('year_level')
            ->get();

        $this->assertCount(2, $activeGroups);
        $this->assertSame(['1ère année', '2ème année'], $activeGroups->pluck('label')->all());

        $newYearOne = $activeGroups->firstWhere('year_level', 1);
        $newYearTwo = $activeGroups->firstWhere('year_level', 2);

        $this->assertNotNull($newYearOne);
        $this->assertNotNull($newYearTwo);
        $this->assertSame(4, Groupe::withTrashed()->where('filiere_id', $filiere->id)->count());

        $stagiaire->refresh();
        $this->assertSame($newYearOne->id, $stagiaire->groupe_id);
        $this->assertDatabaseHas('groupe_stagiaire', [
            'groupe_id' => $newYearOne->id,
            'stagiaire_id' => $stagiaire->id,
        ]);
        $this->assertDatabaseMissing('groupe_stagiaire', [
            'groupe_id' => $legacyYearOne->id,
            'stagiaire_id' => $stagiaire->id,
        ]);

        $this->assertDatabaseHas('module_groupe', [
            'module_id' => $moduleYearOne->id,
            'groupe_id' => $newYearOne->id,
            'academic_year' => $year->id,
            'semester' => 'S1',
        ]);
        $this->assertDatabaseHas('module_groupe', [
            'module_id' => $moduleYearTwo->id,
            'groupe_id' => $newYearTwo->id,
            'academic_year' => $year->id,
            'semester' => 'S4',
        ]);
        $this->assertDatabaseHas('module_groupe', [
            'module_id' => $ambiguousModule->id,
            'groupe_id' => $newYearOne->id,
            'academic_year' => $year->id,
        ]);
        $this->assertDatabaseMissing('module_groupe', [
            'module_id' => $moduleYearOne->id,
            'groupe_id' => $legacyYearOne->id,
        ]);

        $this->assertDatabaseHas('formateur_module_group', [
            'user_id' => $trainer->id,
            'module_id' => $moduleYearOne->id,
            'groupe_id' => $newYearOne->id,
        ]);
        $this->assertDatabaseMissing('formateur_module_group', [
            'user_id' => $trainer->id,
            'module_id' => $moduleYearOne->id,
            'groupe_id' => $legacyYearOne->id,
        ]);
        $this->assertDatabaseHas('formateur_group', [
            'user_id' => $trainer->id,
            'groupe_id' => $newYearOne->id,
        ]);

        $response->assertJsonFragment([
            'code' => 'CG-001',
            'label' => 'Culture générale',
        ]);
    }
}

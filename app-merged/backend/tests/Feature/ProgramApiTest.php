<?php

namespace Tests\Feature;

use App\Models\Filiere;
use App\Models\Groupe;
use App\Models\Module;
use App\Models\Niveau;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProgramApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_program_returns_only_matching_groups_and_modules_for_filiere_and_niveau(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        $filiereA = Filiere::factory()->create(['code' => 'TGI', 'label' => 'TGI', 'name' => 'TGI']);
        $filiereB = Filiere::factory()->create(['code' => 'TSDI', 'label' => 'TSDI', 'name' => 'TSDI']);

        $niveauA1 = Niveau::factory()->create(['filiere_id' => $filiereA->id, 'name' => '1A', 'label' => '1A']);
        $niveauA2 = Niveau::factory()->create(['filiere_id' => $filiereA->id, 'name' => '2A', 'label' => '2A']);
        $niveauB1 = Niveau::factory()->create(['filiere_id' => $filiereB->id, 'name' => '1A', 'label' => '1A']);

        $expectedGroup = Groupe::factory()->create([
            'filiere_id' => $filiereA->id,
            'niveau_id' => $niveauA1->id,
            'label' => 'Groupe A',
            'name' => 'Groupe A',
        ]);
        Groupe::factory()->create([
            'filiere_id' => $filiereA->id,
            'niveau_id' => $niveauA2->id,
            'label' => 'Groupe A',
            'name' => 'Groupe A',
        ]);
        Groupe::factory()->create([
            'filiere_id' => $filiereB->id,
            'niveau_id' => $niveauB1->id,
            'label' => 'Groupe A',
            'name' => 'Groupe A',
        ]);

        $expectedModule = Module::factory()->create([
            'filiere_id' => $filiereA->id,
            'niveau_id' => $niveauA1->id,
            'code' => 'TGI-101',
            'label' => 'Module TGI 1A',
            'name' => 'Module TGI 1A',
        ]);
        Module::factory()->create([
            'filiere_id' => $filiereA->id,
            'niveau_id' => $niveauA2->id,
            'code' => 'TGI-201',
            'label' => 'Module TGI 2A',
            'name' => 'Module TGI 2A',
        ]);
        Module::factory()->create([
            'filiere_id' => $filiereB->id,
            'niveau_id' => $niveauB1->id,
            'code' => 'TSDI-101',
            'label' => 'Module TSDI 1A',
            'name' => 'Module TSDI 1A',
        ]);

        $response = $this->getJson('/api/v1/program?filiere_id='.$filiereA->id.'&niveau=1A');

        $response->assertOk();
        $response->assertJsonCount(1, 'data.groups');
        $response->assertJsonCount(1, 'data.modules');
        $response->assertJsonPath('data.groups.0.id', $expectedGroup->id);
        $response->assertJsonPath('data.modules.0.id', $expectedModule->id);
    }

    public function test_program_returns_empty_arrays_when_niveau_not_found(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        $filiere = Filiere::factory()->create();

        $response = $this->getJson('/api/v1/program?filiere_id='.$filiere->id.'&niveau=3A');

        $response->assertOk();
        $response->assertJsonPath('data.modules', []);
        $response->assertJsonPath('data.groups', []);
    }
}

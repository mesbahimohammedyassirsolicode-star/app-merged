<?php

namespace Tests\Feature;

use App\Models\Filiere;
use App\Models\Groupe;
use App\Models\Niveau;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GroupsFilterTest extends TestCase
{
    use RefreshDatabase;

    public function test_groups_can_be_filtered_by_niveau_id(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        $filiere = Filiere::factory()->create();
        $niveau1 = Niveau::factory()->create(['filiere_id' => $filiere->id, 'name' => '1A', 'label' => '1A']);
        $niveau2 = Niveau::factory()->create(['filiere_id' => $filiere->id, 'name' => '2A', 'label' => '2A']);

        $expected = Groupe::factory()->create([
            'filiere_id' => $filiere->id,
            'niveau_id' => $niveau1->id,
            'label' => 'Groupe A1',
            'name' => 'Groupe A1',
        ]);

        Groupe::factory()->create([
            'filiere_id' => $filiere->id,
            'niveau_id' => $niveau2->id,
            'label' => 'Groupe A2',
            'name' => 'Groupe A2',
        ]);

        $response = $this->getJson('/api/v1/groups?niveau_id='.$niveau1->id);

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.id', $expected->id);
        $response->assertJsonPath('data.0.niveau_id', $niveau1->id);
    }
}

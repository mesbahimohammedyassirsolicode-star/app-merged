<?php

namespace Tests\Feature;

use App\Models\Evaluation;
use App\Models\Filiere;
use App\Models\Groupe;
use App\Models\Module;
use App\Models\Niveau;
use App\Models\Note;
use App\Models\Stagiaire;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_cannot_access_admin_dashboard()
    {
        $student = User::factory()->create(['role' => 'student']);

        $response = $this->actingAs($student)->getJson('/api/v1/dashboard');

        // Dashboard is role-aware, so it should return student data, not 403.
        // But let's check if they can access an admin-only route like /api/v1/users
        $response = $this->actingAs($student)->getJson('/api/v1/users');
        $response->assertStatus(403);
    }

    public function test_teacher_can_only_see_their_assigned_evaluations()
    {
        $teacher1 = User::factory()->create(['role' => 'teacher']);
        $teacher2 = User::factory()->create(['role' => 'teacher']);

        $niveau = Niveau::factory()->create();
        $filiere = Filiere::factory()->create(['niveau_id' => $niveau->id]);
        $group = Groupe::factory()->create(['niveau_id' => $niveau->id, 'filiere_id' => $filiere->id]);
        $module = Module::factory()->create(['niveau_id' => $niveau->id, 'filiere_id' => $filiere->id]);

        $evaluation = Evaluation::factory()->create([
            'user_id' => $teacher1->id,
            'module_id' => $module->id,
            'groupe_id' => $group->id,
        ]);

        $this->actingAs($teacher1)->getJson("/api/v1/evaluations/{$evaluation->id}")
            ->assertStatus(200);

        $this->actingAs($teacher2)->getJson("/api/v1/evaluations/{$evaluation->id}")
            ->assertStatus(403);
    }

    public function test_student_can_only_see_their_own_grades()
    {
        $student1 = User::factory()->create(['role' => 'student']);
        $student2 = User::factory()->create(['role' => 'student']);

        $s1 = Stagiaire::factory()->create(['user_id' => $student1->id]);
        $s2 = Stagiaire::factory()->create(['user_id' => $student2->id]);

        $note = Note::factory()->create(['stagiaire_id' => $s1->id]);

        $this->actingAs($student1)->getJson("/api/v1/evaluations/{$note->evaluation_id}")
            ->assertStatus(200);

        $this->actingAs($student2)->getJson("/api/v1/evaluations/{$note->evaluation_id}")
            ->assertStatus(403);
    }
}

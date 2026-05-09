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

class RbacRouteAccessMatrixTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_allows_admin_trainer_parent_and_student_roles(): void
    {
        $admin = $this->makeUser('admin');
        $trainer = $this->makeUser('formateur');
        $parent = $this->makeUser('parent');
        $student = $this->makeUser('stagiaire');

        Sanctum::actingAs($admin);
        $this->getJson('/api/v1/dashboard')->assertOk();

        Sanctum::actingAs($trainer);
        $this->getJson('/api/v1/dashboard')->assertOk();

        Sanctum::actingAs($parent);
        $this->getJson('/api/v1/dashboard')->assertOk();

        Sanctum::actingAs($student);
        $this->getJson('/api/v1/dashboard')->assertOk();
    }

    public function test_users_endpoint_is_admin_only(): void
    {
        Sanctum::actingAs($this->makeUser('admin'));
        $this->getJson('/api/v1/users')->assertOk();

        Sanctum::actingAs($this->makeUser('formateur'));
        $this->getJson('/api/v1/users')->assertForbidden();

        Sanctum::actingAs($this->makeUser('parent'));
        $this->getJson('/api/v1/users')->assertForbidden();

        Sanctum::actingAs($this->makeUser('stagiaire'));
        $this->getJson('/api/v1/users')->assertForbidden();
    }

    public function test_modules_endpoint_is_admin_or_trainer_only(): void
    {
        Sanctum::actingAs($this->makeUser('admin'));
        $this->getJson('/api/v1/modules')->assertOk();

        Sanctum::actingAs($this->makeUser('formateur'));
        $this->getJson('/api/v1/modules')->assertOk();

        Sanctum::actingAs($this->makeUser('parent'));
        $this->getJson('/api/v1/modules')->assertOk();

        Sanctum::actingAs($this->makeUser('stagiaire'));
        $this->getJson('/api/v1/modules')->assertOk();
    }

    public function test_grades_endpoint_is_admin_or_trainer_only(): void
    {
        // Authorized roles pass middleware; validation then fails because query params are omitted.
        Sanctum::actingAs($this->makeUser('admin'));
        $this->getJson('/api/v1/grades')->assertStatus(422);

        Sanctum::actingAs($this->makeUser('formateur'));
        $this->getJson('/api/v1/grades')->assertStatus(422);

        Sanctum::actingAs($this->makeUser('parent'));
        $this->getJson('/api/v1/grades')->assertForbidden();

        Sanctum::actingAs($this->makeUser('stagiaire'));
        $this->getJson('/api/v1/grades')->assertForbidden();
    }

    public function test_grades_post_is_writable_by_admin_and_assigned_trainer_only(): void
    {
        $ctx = $this->seedGradesContext();

        Sanctum::actingAs($ctx['admin']);
        $adminResponse = $this->postJson('/api/v1/grades', [
            'module_id' => $ctx['module']->id,
            'groupe_id' => $ctx['groupe']->id,
            'stagiaire_id' => $ctx['stagiaire']->id,
            'valeur' => 16,
        ]);
        $adminResponse->assertOk();

        Sanctum::actingAs($ctx['assignedTrainer']);
        $trainerOkResponse = $this->postJson('/api/v1/grades', [
            'module_id' => $ctx['module']->id,
            'groupe_id' => $ctx['groupe']->id,
            'stagiaire_id' => $ctx['stagiaire']->id,
            'valeur' => 15,
        ]);
        $trainerOkResponse->assertOk();

        Sanctum::actingAs($ctx['unassignedTrainer']);
        $trainerForbiddenResponse = $this->postJson('/api/v1/grades', [
            'module_id' => $ctx['module']->id,
            'groupe_id' => $ctx['groupe']->id,
            'stagiaire_id' => $ctx['stagiaire']->id,
            'valeur' => 14,
        ]);
        $trainerForbiddenResponse->assertForbidden();

        Sanctum::actingAs($ctx['parent']);
        $this->postJson('/api/v1/grades', [
            'module_id' => $ctx['module']->id,
            'groupe_id' => $ctx['groupe']->id,
            'stagiaire_id' => $ctx['stagiaire']->id,
            'valeur' => 12,
        ])->assertForbidden();

        Sanctum::actingAs($ctx['student']);
        $this->postJson('/api/v1/grades', [
            'module_id' => $ctx['module']->id,
            'groupe_id' => $ctx['groupe']->id,
            'stagiaire_id' => $ctx['stagiaire']->id,
            'valeur' => 12,
        ])->assertForbidden();
    }

    private function makeUser(string $role): User
    {
        return User::factory()->create([
            'role' => $role,
            'is_active' => true,
        ]);
    }

    /**
     * @return array{
     *   admin:User,
     *   assignedTrainer:User,
     *   unassignedTrainer:User,
     *   parent:User,
     *   student:User,
     *   stagiaire:Stagiaire,
     *   module:Module,
     *   groupe:Groupe
     * }
     */
    private function seedGradesContext(): array
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
            'label' => 'G-RBAC',
            'year_level' => 1,
            'capacity' => 25,
        ]);

        $module = Module::query()->create([
            'niveau_id' => $niveau->id,
            'filiere_id' => $filiere->id,
            'code' => 'M-RBAC',
            'name' => 'RBAC Module',
            'label' => 'RBAC Module',
            'masse_horaire' => 30,
            'coefficient' => 1,
            'semester' => 'S1',
        ]);

        DB::table('module_groupe')->insert([
            'module_id' => $module->id,
            'groupe_id' => $groupe->id,
            'academic_year' => $year->id,
            'semester' => 'S1',
            'planned_hours' => 20,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $admin = $this->makeUser('admin');
        $assignedTrainer = $this->makeUser('formateur');
        $unassignedTrainer = $this->makeUser('formateur');
        $parent = $this->makeUser('parent');
        $student = $this->makeUser('stagiaire');

        DB::table('module_trainer')->insert([
            'user_id' => $assignedTrainer->id,
            'module_id' => $module->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $stagiaire = Stagiaire::query()->create([
            'user_id' => $student->id,
            'filiere_id' => $filiere->id,
            'groupe_id' => $groupe->id,
            'cef_number' => 'CEF-RBAC-POST',
            'cin' => 'CIN-RBAC-POST',
            'date_naissance' => '2005-01-01',
            'status' => 'actif',
        ]);

        return [
            'admin' => $admin,
            'assignedTrainer' => $assignedTrainer,
            'unassignedTrainer' => $unassignedTrainer,
            'parent' => $parent,
            'student' => $student,
            'stagiaire' => $stagiaire,
            'module' => $module,
            'groupe' => $groupe,
        ];
    }
}


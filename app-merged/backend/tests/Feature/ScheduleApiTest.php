<?php

namespace Tests\Feature;

use App\Models\AnneeScolaire;
use App\Models\Filiere;
use App\Models\Groupe;
use App\Models\Module;
use App\Models\Niveau;
use App\Models\Seance;
use App\Models\Stagiaire;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ScheduleApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_returns_group_schedule_and_non_overridden_global_schedule(): void
    {
        $context = $this->seedAcademicContext();
        $admin = $context['admin'];
        $group = $context['group'];
        $module = $context['module'];

        Sanctum::actingAs($admin);

        Seance::create([
            'user_id' => $admin->id,
            'module_id' => $module->id,
            'filiere_id' => $context['filiere']->id,
            'groupe_id' => null,
            'date' => '2026-04-14',
            'start_time' => '09:00',
            'end_time' => '11:00',
            'status' => 'planifie',
            'type' => 'presentiel',
        ]);

        Seance::create([
            'user_id' => $admin->id,
            'module_id' => $module->id,
            'filiere_id' => $context['filiere']->id,
            'groupe_id' => $group->id,
            'date' => '2026-04-14',
            'start_time' => '09:00',
            'end_time' => '11:00',
            'status' => 'planifie',
            'type' => 'presentiel',
        ]);

        Seance::create([
            'user_id' => $admin->id,
            'module_id' => $module->id,
            'filiere_id' => $context['filiere']->id,
            'groupe_id' => null,
            'date' => '2026-04-15',
            'start_time' => '08:30',
            'end_time' => '10:30',
            'status' => 'planifie',
            'type' => 'presentiel',
        ]);

        $response = $this->getJson('/api/v1/schedules?week_start=2026-04-13&groupe_id='.$group->id);

        $response->assertOk();
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('data.scope.requested_groupe_id', $group->id);
        $response->assertJsonPath('data.scope.effective_filiere_id', null);
        $response->assertJsonCount(2, 'data.schedules');
        $response->assertJsonCount(1, 'data.by_date.2026-04-14');
        $response->assertJsonPath('data.by_date.2026-04-14.0.scope', 'group');
        $response->assertJsonFragment([
            'scope' => 'group',
            'groupe_id' => $group->id,
            'date' => '2026-04-14',
            'start_time' => '09:00',
            'end_time' => '11:00',
        ]);
        $response->assertJsonFragment([
            'scope' => 'global',
            'groupe_id' => null,
            'date' => '2026-04-15',
            'start_time' => '08:30',
            'end_time' => '10:30',
        ]);
    }

    public function test_it_validates_schedule_query_parameters(): void
    {
        $context = $this->seedAcademicContext();
        Sanctum::actingAs($context['admin']);

        $response = $this->getJson('/api/v1/schedules?week_start=invalid-date&groupe_id=not-an-int');

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['week_start', 'groupe_id']);
    }

    public function test_student_sees_group_sessions_in_filiere_without_group_pivot(): void
    {
        $ctx = $this->seedAcademicContext();
        $filiere = $ctx['filiere'];
        $group = $ctx['group'];
        $admin = $ctx['admin'];
        $module = $ctx['module'];

        $studentUser = User::create([
            'name' => 'Student No Pivot',
            'email' => 'student.nopivot@test.com',
            'password' => bcrypt('password'),
            'role' => 'stagiaire',
            'is_active' => true,
        ]);
        Stagiaire::create([
            'user_id' => $studentUser->id,
            'filiere_id' => $filiere->id,
            'groupe_id' => null,
            'cef_number' => 'ST-NP-001',
            'cin' => 'BB654321',
            'date_naissance' => '2005-01-15',
            'status' => 'actif',
        ]);

        $groupSession = Seance::create([
            'user_id' => $admin->id,
            'module_id' => $module->id,
            'filiere_id' => $filiere->id,
            'groupe_id' => $group->id,
            'date' => '2026-04-16',
            'start_time' => '11:00',
            'end_time' => '12:00',
            'status' => 'planifie',
            'type' => 'presentiel',
        ]);

        Sanctum::actingAs($studentUser);

        $response = $this->getJson('/api/v1/schedules?week_start=2026-04-13');

        $response->assertOk();
        $response->assertJsonPath('data.scope.effective_filiere_id', $filiere->id);
        $response->assertJsonFragment(['id' => $groupSession->id]);
    }

    public function test_student_sees_only_own_filiere_and_school_wide_globals(): void
    {
        $ctx = $this->seedAcademicContext();
        $f1 = $ctx['filiere'];
        $g1 = $ctx['group'];
        $admin = $ctx['admin'];
        $mod1 = $ctx['module'];

        $n2 = Niveau::create([
            'filiere_id' => null,
            'name' => 'N2',
            'label' => 'N2',
            'code' => 'N2',
        ]);
        $f2 = Filiere::create([
            'niveau_id' => $n2->id,
            'name' => 'Autre Filiere',
            'label' => 'Autre Filiere',
            'code' => 'AF',
        ]);
        $n2->update(['filiere_id' => $f2->id]);

        $year = $ctx['year'];
        $g2 = Groupe::create([
            'niveau_id' => $n2->id,
            'filiere_id' => $f2->id,
            'annee_scolaire_id' => $year->id,
            'name' => 'AF-101',
            'label' => 'AF-101',
            'year_level' => 1,
            'capacity' => 30,
        ]);
        $mod2 = Module::create([
            'niveau_id' => $n2->id,
            'filiere_id' => $f2->id,
            'code' => 'M-AF-01',
            'name' => 'Other',
            'label' => 'Other',
            'masse_horaire' => 30,
            'coefficient' => 1,
            'semester' => 'S1',
        ]);

        $studentUser = User::create([
            'name' => 'Student Schedules',
            'email' => 'student.schedules@test.com',
            'password' => bcrypt('password'),
            'role' => 'stagiaire',
            'is_active' => true,
        ]);
        $stagiaire = Stagiaire::create([
            'user_id' => $studentUser->id,
            'filiere_id' => $f1->id,
            'groupe_id' => $g1->id,
            'cef_number' => 'ST-SCH-001',
            'cin' => 'AA123456',
            'date_naissance' => '2005-06-01',
            'status' => 'actif',
        ]);
        $stagiaire->groupes()->sync([$g1->id]);

        $schoolWide = Seance::create([
            'user_id' => $admin->id,
            'module_id' => $mod1->id,
            'filiere_id' => null,
            'groupe_id' => null,
            'date' => '2026-04-14',
            'start_time' => '08:00',
            'end_time' => '09:00',
            'status' => 'planifie',
            'type' => 'presentiel',
        ]);

        $otherFiliereGlobal = Seance::create([
            'user_id' => $admin->id,
            'module_id' => $mod2->id,
            'filiere_id' => $f2->id,
            'groupe_id' => null,
            'date' => '2026-04-14',
            'start_time' => '10:00',
            'end_time' => '11:00',
            'status' => 'planifie',
            'type' => 'presentiel',
        ]);

        $ownFiliereGlobal = Seance::create([
            'user_id' => $admin->id,
            'module_id' => $mod1->id,
            'filiere_id' => $f1->id,
            'groupe_id' => null,
            'date' => '2026-04-14',
            'start_time' => '14:00',
            'end_time' => '15:00',
            'status' => 'planifie',
            'type' => 'presentiel',
        ]);

        Sanctum::actingAs($studentUser);

        $response = $this->getJson('/api/v1/schedules?week_start=2026-04-13');

        $response->assertOk();
        $response->assertJsonPath('data.scope.effective_filiere_id', $f1->id);
        $response->assertJsonCount(2, 'data.schedules');
        $ids = collect($response->json('data.schedules'))->pluck('id')->sort()->values()->all();
        $this->assertEquals(
            [$schoolWide->id, $ownFiliereGlobal->id],
            $ids
        );
        $this->assertNotContains($otherFiliereGlobal->id, $ids);
    }

    public function test_it_falls_back_to_closest_week_when_requested_week_is_empty(): void
    {
        $context = $this->seedAcademicContext();
        $admin = $context['admin'];
        $module = $context['module'];

        Sanctum::actingAs($admin);

        Seance::create([
            'user_id' => $admin->id,
            'module_id' => $module->id,
            'filiere_id' => $context['filiere']->id,
            'groupe_id' => null,
            'date' => '2026-01-14',
            'start_time' => '09:00',
            'end_time' => '10:00',
            'status' => 'planifie',
            'type' => 'presentiel',
        ]);

        $response = $this->getJson('/api/v1/schedules?week_start=2026-04-13');

        $response->assertOk();
        $response->assertJsonPath('data.week_start', '2026-01-12');
        $response->assertJsonCount(1, 'data.schedules');
    }

    /**
     * @return array{
     *   year: AnneeScolaire,
     *   niveau: Niveau,
     *   filiere: Filiere,
     *   group: Groupe,
     *   module: Module,
     *   admin: User
     * }
     */
    private function seedAcademicContext(): array
    {
        $year = AnneeScolaire::create([
            'year_start' => 2025,
            'year_end' => 2026,
            'label' => '2025-2026',
            'is_current' => true,
            'start_date' => '2025-09-01',
            'end_date' => '2026-06-30',
        ]);

        $niveau = Niveau::create([
            'name' => 'Technicien Specialise',
            'label' => 'Technicien Specialise',
            'code' => 'TS',
        ]);

        $filiere = Filiere::create([
            'niveau_id' => $niveau->id,
            'name' => 'Developpement Digital',
            'label' => 'Developpement Digital',
            'code' => 'DD',
        ]);

        $niveau->update(['filiere_id' => $filiere->id]);

        $group = Groupe::create([
            'niveau_id' => $niveau->id,
            'filiere_id' => $filiere->id,
            'annee_scolaire_id' => $year->id,
            'name' => 'DD-101',
            'label' => 'DD-101',
            'year_level' => 1,
            'capacity' => 30,
        ]);

        $module = Module::create([
            'niveau_id' => $niveau->id,
            'filiere_id' => $filiere->id,
            'code' => 'M-DD-01',
            'name' => 'Laravel',
            'label' => 'Laravel',
            'masse_horaire' => 60,
            'coefficient' => 2,
            'semester' => 'S1',
        ]);

        $admin = User::create([
            'name' => 'Admin Schedules',
            'email' => 'admin.schedules@test.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'is_active' => true,
        ]);

        return [
            'year' => $year,
            'niveau' => $niveau,
            'filiere' => $filiere,
            'group' => $group,
            'module' => $module,
            'admin' => $admin,
        ];
    }
}

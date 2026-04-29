<?php

namespace Tests\Feature;

use App\Models\Affectation;
use App\Models\AnneeScolaire;
use App\Models\Filiere;
use App\Models\Formateur;
use App\Models\Groupe;
use App\Models\Module;
use App\Models\Niveau;
use App\Models\Seance;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Regression: timetable-backed seances use user_id/module_id/groupe_id; legacy list
 * used only affectation.formateur and hid those rows from formateurs.
 */
class SeancesListForFormateurTest extends TestCase
{
    use RefreshDatabase;

    public function test_formateur_sees_timetable_style_seance_without_affectation(): void
    {
        $ctx = $this->seedMinimalScheduleContext();
        $formateurUser = $ctx['formateur_user'];

        Seance::query()->create([
            'affectation_id' => null,
            'date' => '2025-10-08',
            'start_time' => '09:00:00',
            'end_time' => '11:00:00',
            'status' => 'planifie',
            'type' => 'presentiel',
            'user_id' => $formateurUser->id,
            'module_id' => $ctx['module']->id,
            'groupe_id' => $ctx['group']->id,
            'filiere_id' => $ctx['filiere']->id,
        ]);

        Sanctum::actingAs($formateurUser);

        $response = $this->getJson('/api/v1/seances?start_date=2025-10-01&end_date=2025-10-31&per_page=30');

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.module_id', $ctx['module']->id);
        $response->assertJsonPath('data.0.groupe_id', $ctx['group']->id);
    }

    public function test_formateur_sees_legacy_seance_via_affectation(): void
    {
        $ctx = $this->seedMinimalScheduleContext();
        $formateurUser = $ctx['formateur_user'];
        $formateur = Formateur::query()->where('user_id', $formateurUser->id)->firstOrFail();

        $affectation = Affectation::query()->create([
            'formateur_id' => $formateur->id,
            'module_id' => $ctx['module']->id,
            'groupe_id' => $ctx['group']->id,
            'annee_scolaire_id' => $ctx['year']->id,
        ]);

        Seance::query()->create([
            'affectation_id' => $affectation->id,
            'date' => '2025-10-09',
            'start_time' => '14:00:00',
            'end_time' => '16:00:00',
            'status' => 'planifie',
            'type' => 'presentiel',
            'filiere_id' => $ctx['filiere']->id,
            'groupe_id' => $ctx['group']->id,
        ]);

        Sanctum::actingAs($formateurUser);

        $response = $this->getJson('/api/v1/seances?start_date=2025-10-01&end_date=2025-10-31&per_page=30');

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.affectation_id', $affectation->id);
    }

    public function test_formateur_does_not_see_other_teacher_timetable_seance(): void
    {
        $ctx = $this->seedMinimalScheduleContext();
        $other = User::query()->create([
            'name' => 'Other Teacher',
            'email' => 'other.teacher@test.com',
            'password' => bcrypt('password'),
            'role' => 'formateur',
            'is_active' => true,
        ]);
        Formateur::query()->create([
            'user_id' => $other->id,
            'matricule' => 'F-OTHER',
            'specialty' => 'X',
            'type' => 'permanent',
            'filiere_id' => $ctx['filiere']->id,
        ]);

        Seance::query()->create([
            'affectation_id' => null,
            'date' => '2025-10-10',
            'start_time' => '10:00:00',
            'end_time' => '12:00:00',
            'status' => 'planifie',
            'type' => 'presentiel',
            'user_id' => $other->id,
            'module_id' => $ctx['module']->id,
            'groupe_id' => $ctx['group']->id,
            'filiere_id' => $ctx['filiere']->id,
        ]);

        Sanctum::actingAs($ctx['formateur_user']);

        $response = $this->getJson('/api/v1/seances?start_date=2025-10-01&end_date=2025-10-31&per_page=30');

        $response->assertOk();
        $response->assertJsonCount(0, 'data');
    }

    /**
     * @return array{year: AnneeScolaire, filiere: Filiere, group: Groupe, module: Module, formateur_user: User}
     */
    private function seedMinimalScheduleContext(): array
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
            'name' => 'Technicien Specialise',
            'label' => 'Technicien Specialise',
            'code' => 'TS',
        ]);

        $filiere = Filiere::query()->create([
            'niveau_id' => $niveau->id,
            'name' => 'Developpement Digital',
            'label' => 'Developpement Digital',
            'code' => 'DD',
        ]);

        $group = Groupe::query()->create([
            'niveau_id' => $niveau->id,
            'filiere_id' => $filiere->id,
            'annee_scolaire_id' => $year->id,
            'name' => 'DD-101',
            'label' => 'DD-101',
            'year_level' => 1,
            'capacity' => 30,
        ]);

        $module = Module::query()->create([
            'niveau_id' => $niveau->id,
            'filiere_id' => $filiere->id,
            'code' => 'M-DD-01',
            'name' => 'Laravel',
            'label' => 'Laravel',
            'masse_horaire' => 60,
            'coefficient' => 2,
            'semester' => 'S1',
        ]);

        $formateurUser = User::query()->create([
            'name' => 'Formateur User',
            'email' => 'formateur.seances@test.com',
            'password' => bcrypt('password'),
            'role' => 'formateur',
            'is_active' => true,
        ]);

        $formateur = Formateur::query()->create([
            'user_id' => $formateurUser->id,
            'matricule' => 'F-200',
            'specialty' => 'Web',
            'type' => 'permanent',
            'filiere_id' => $filiere->id,
        ]);

        DB::table('teacher_module')->insert([
            'teacher_id' => $formateur->id,
            'module_id' => $module->id,
            'academic_year' => $year->id,
            'semester' => 'S1',
            'weekly_hours' => 4,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('module_groupe')->insert([
            'module_id' => $module->id,
            'groupe_id' => $group->id,
            'academic_year' => $year->id,
            'semester' => 'S1',
            'planned_hours' => 60,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return [
            'year' => $year,
            'filiere' => $filiere,
            'group' => $group,
            'module' => $module,
            'formateur_user' => $formateurUser,
        ];
    }
}

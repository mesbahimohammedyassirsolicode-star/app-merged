<?php

namespace Tests\Feature;

use App\Analytics\Jobs\RefreshAnalyticsAggregatesJob;
use App\Models\AnneeScolaire;
use App\Models\Attendance;
use App\Models\Evaluation;
use App\Models\Filiere;
use App\Models\Formateur;
use App\Models\Groupe;
use App\Models\Module;
use App\Models\Niveau;
use App\Models\Note;
use App\Models\Stagiaire;
use App\Models\StudentParent;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AnalyticsCopilotApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        CarbonImmutable::setTestNow('2026-05-10 10:00:00');
    }

    protected function tearDown(): void
    {
        CarbonImmutable::setTestNow();

        parent::tearDown();
    }

    public function test_student_can_access_analytics_catalog(): void
    {
        $student = User::factory()->create(['role' => 'student']);

        Sanctum::actingAs($student);

        $response = $this->getJson('/api/v1/analytics/catalog');

        $response->assertOk();
        $response->assertJsonPath('data.metrics.attendance_rate.label', 'Attendance Rate');
        $response->assertJsonPath('data.dimensions.month.label', 'Month');
    }

    public function test_teacher_structured_query_is_scoped_to_assigned_group(): void
    {
        $context = $this->seedAnalyticsContext();

        Sanctum::actingAs($context['teacher_user']);

        $response = $this->postJson('/api/v1/analytics/query', [
            'metric' => 'attendance_rate',
            'dimension' => 'group',
            'filters' => [
                'date_from' => '2026-05-01',
                'date_to' => '2026-05-31',
            ],
        ]);

        $response->assertOk();
        $rows = $response->json('data.rows');

        $this->assertCount(1, $rows);
        $this->assertSame('DD-101', $rows[0]['label']);
    }

    public function test_teacher_copilot_query_returns_scoped_conversation_payload(): void
    {
        $context = $this->seedAnalyticsContext();

        Sanctum::actingAs($context['teacher_user']);

        $response = $this->postJson('/api/v1/analytics/copilot/query', [
            'query' => 'Show students at risk this month',
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.intent.name', 'students_at_risk');
        $response->assertJsonPath('data.scope.type', 'trainer_assigned_groups');
        $response->assertJsonStructure([
            'data' => [
                'conversation_id',
                'message_id',
                'summary',
                'insights',
                'recommendations',
                'data',
                'charts',
                'follow_up_suggestions',
                'meta' => ['trace_id', 'plan'],
            ],
        ]);

        $students = $response->json('data.data');
        $this->assertNotEmpty($students);
        $this->assertSame('Assigned Student', $students[0]['student_name']);
    }

    public function test_student_cannot_use_copilot_query_endpoint(): void
    {
        $student = User::factory()->create(['role' => 'student']);

        Sanctum::actingAs($student);

        $response = $this->postJson('/api/v1/analytics/copilot/query', [
            'query' => 'Show students at risk this month',
        ]);

        $response->assertForbidden();
    }

    public function test_parent_copilot_scope_is_limited_to_linked_child(): void
    {
        $context = $this->seedAnalyticsContext();

        $parentUser = User::factory()->create([
            'role' => 'parent',
            'email' => 'parent.analytics@test.com',
        ]);

        $parent = StudentParent::create([
            'user_id' => $parentUser->id,
            'cin' => 'PA123456',
            'phone' => '0600000000',
        ]);
        $parent->stagiaires()->attach($context['assigned_stagiaire']->id);

        Sanctum::actingAs($parentUser);

        $response = $this->postJson('/api/v1/analytics/copilot/query', [
            'query' => 'Show students at risk this month',
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.scope.type', 'parent_children');
        $students = $response->json('data.data');

        $this->assertCount(1, $students);
        $this->assertSame('Assigned Student', $students[0]['student_name']);
    }

    public function test_analytics_refresh_command_populates_aggregate_tables(): void
    {
        $context = $this->seedAnalyticsContext();

        $this->artisan('analytics:refresh-aggregates', [
            '--date-from' => '2026-05-01',
            '--date-to' => '2026-05-31',
        ])->assertSuccessful();

        $this->assertDatabaseCount('analytics_daily_student_metrics', 2);
        $this->assertDatabaseHas('analytics_daily_group_metrics', [
            'groupe_id' => $context['assigned_stagiaire']->groupe_id,
            'metric_date' => '2026-05-05',
        ]);
        $this->assertDatabaseHas('analytics_monthly_student_risk', [
            'student_id' => $context['assigned_stagiaire']->user_id,
            'month_key' => '2026-05',
        ]);
    }

    public function test_analytics_refresh_command_can_queue_job(): void
    {
        Bus::fake();

        $this->artisan('analytics:refresh-aggregates', [
            '--date-from' => '2026-05-01',
            '--date-to' => '2026-05-31',
            '--queue' => true,
        ])->assertSuccessful();

        Bus::assertDispatched(RefreshAnalyticsAggregatesJob::class, function (RefreshAnalyticsAggregatesJob $job) {
            return $job->dateFrom === '2026-05-01' && $job->dateTo === '2026-05-31';
        });
    }

    /**
     * @return array{
     *   teacher_user: User,
     *   assigned_stagiaire: Stagiaire,
     *   outside_stagiaire: Stagiaire
     * }
     */
    private function seedAnalyticsContext(): array
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

        $groupA = Groupe::create([
            'niveau_id' => $niveau->id,
            'filiere_id' => $filiere->id,
            'annee_scolaire_id' => $year->id,
            'name' => 'DD-101',
            'label' => 'DD-101',
            'year_level' => 1,
            'capacity' => 30,
        ]);

        $groupB = Groupe::create([
            'niveau_id' => $niveau->id,
            'filiere_id' => $filiere->id,
            'annee_scolaire_id' => $year->id,
            'name' => 'DD-202',
            'label' => 'DD-202',
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

        $teacherUser = User::create([
            'name' => 'Teacher Analytics',
            'email' => 'teacher.analytics@test.com',
            'password' => bcrypt('password'),
            'role' => 'teacher',
            'is_active' => true,
        ]);

        Formateur::create([
            'user_id' => $teacherUser->id,
            'matricule' => 'F-AN-1',
            'specialty' => 'Analytics',
            'type' => 'permanent',
        ]);

        DB::table('module_groupe')->insert([
            [
                'module_id' => $module->id,
                'groupe_id' => $groupA->id,
                'academic_year' => $year->id,
                'semester' => 'S1',
                'planned_hours' => 60,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'module_id' => $module->id,
                'groupe_id' => $groupB->id,
                'academic_year' => $year->id,
                'semester' => 'S1',
                'planned_hours' => 60,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        DB::table('formateur_module_group')->insert([
            'user_id' => $teacherUser->id,
            'module_id' => $module->id,
            'groupe_id' => $groupA->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $assignedUser = User::create([
            'name' => 'Assigned Student',
            'email' => 'assigned.student@test.com',
            'password' => bcrypt('password'),
            'role' => 'student',
            'is_active' => true,
        ]);

        $outsideUser = User::create([
            'name' => 'Outside Student',
            'email' => 'outside.student@test.com',
            'password' => bcrypt('password'),
            'role' => 'student',
            'is_active' => true,
        ]);

        $assignedStagiaire = Stagiaire::create([
            'user_id' => $assignedUser->id,
            'filiere_id' => $filiere->id,
            'groupe_id' => $groupA->id,
            'cef_number' => 'CEF-AN-1',
            'cin' => 'STAN001',
            'date_naissance' => '2004-01-01',
            'status' => 'actif',
        ]);

        $outsideStagiaire = Stagiaire::create([
            'user_id' => $outsideUser->id,
            'filiere_id' => $filiere->id,
            'groupe_id' => $groupB->id,
            'cef_number' => 'CEF-AN-2',
            'cin' => 'STAN002',
            'date_naissance' => '2004-01-02',
            'status' => 'actif',
        ]);

        $assignedStagiaire->groupes()->attach($groupA->id);
        $outsideStagiaire->groupes()->attach($groupB->id);

        $assignedEvaluation = Evaluation::create([
            'user_id' => $teacherUser->id,
            'module_id' => $module->id,
            'groupe_id' => $groupA->id,
            'item_label' => 'Quiz A',
            'type' => 'cc',
            'max_points' => 20,
            'coefficient' => 1,
            'date' => '2026-05-05',
        ]);

        $outsideEvaluation = Evaluation::create([
            'user_id' => $teacherUser->id,
            'module_id' => $module->id,
            'groupe_id' => $groupB->id,
            'item_label' => 'Quiz B',
            'type' => 'cc',
            'max_points' => 20,
            'coefficient' => 1,
            'date' => '2026-05-05',
        ]);

        Note::create([
            'evaluation_id' => $assignedEvaluation->id,
            'stagiaire_id' => $assignedStagiaire->id,
            'valeur' => 8,
        ]);

        Note::create([
            'evaluation_id' => $outsideEvaluation->id,
            'stagiaire_id' => $outsideStagiaire->id,
            'valeur' => 17,
        ]);

        Attendance::create([
            'student_id' => $assignedUser->id,
            'module_id' => $module->id,
            'group_id' => $groupA->id,
            'teacher_id' => $teacherUser->id,
            'date' => '2026-05-05',
            'status' => 'absent',
            'academic_year' => '2025-2026',
            'created_by' => $teacherUser->id,
        ]);

        Attendance::create([
            'student_id' => $outsideUser->id,
            'module_id' => $module->id,
            'group_id' => $groupB->id,
            'teacher_id' => $teacherUser->id,
            'date' => '2026-05-05',
            'status' => 'present',
            'academic_year' => '2025-2026',
            'created_by' => $teacherUser->id,
        ]);

        return [
            'teacher_user' => $teacherUser,
            'assigned_stagiaire' => $assignedStagiaire,
            'outside_stagiaire' => $outsideStagiaire,
        ];
    }
}

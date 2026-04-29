<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_dashboard_returns_200_and_payload_on_sqlite(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'is_active' => true,
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/dashboard');

        $response->assertOk();
        $response->assertJsonPath('data.role', 'admin');
        $response->assertJsonStructure([
            'success',
            'data' => [
                'role',
                'data' => [
                    'stats' => ['total_students', 'total_teachers', 'total_filieres', 'total_groupes'],
                    'charts' => ['students_per_filiere'],
                    'attendance' => ['absence_rate_by_group_module', 'monthly_summary'],
                    'quick_actions',
                ],
            ],
        ]);
        $this->assertIsArray($response->json('data.data.attendance.monthly_summary'));
    }
}

<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HealthTest extends TestCase
{
    use RefreshDatabase;

    public function test_health_returns_200_when_database_ok(): void
    {
        $response = $this->getJson('/api/v1/health');

        $response->assertStatus(200);
        $response->assertJsonPath('data.status', 'healthy');
        $response->assertJsonPath('data.checks.app', 'ok');
        $response->assertJsonPath('data.checks.database', 'ok');
    }
}

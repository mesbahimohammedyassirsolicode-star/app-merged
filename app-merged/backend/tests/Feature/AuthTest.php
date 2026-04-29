<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_returns_401_with_invalid_credentials(): void
    {
        User::factory()->create(['email' => 'user@test.com']);

        $response = $this->postJson('/api/v1/login', [
            'email' => 'user@test.com',
            'password' => 'wrong',
        ]);

        $response->assertStatus(401);
    }

    public function test_login_returns_data_with_valid_credentials(): void
    {
        User::factory()->create([
            'email' => 'user@test.com',
            'password' => bcrypt('password123'),
            'role' => 'admin',
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/v1/login', [
            'email' => 'user@test.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure(['data' => ['access_token', 'token_type', 'user']]);
        $this->assertNotEmpty($response->json('data.access_token'));
    }

    public function test_me_returns_401_without_token(): void
    {
        $response = $this->getJson('/api/v1/me');
        $response->assertStatus(401);
    }
}

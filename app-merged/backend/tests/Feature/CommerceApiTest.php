<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CommerceApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_product(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'is_active' => true,
        ]);

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/v1/products', [
            'name' => 'Laravel Handbook',
            'description' => 'API architecture guide',
            'price' => 199.99,
            'stock' => 25,
            'is_active' => true,
        ]);

        $response->assertCreated();
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('data.name', 'Laravel Handbook');
        $this->assertDatabaseHas('products', [
            'name' => 'Laravel Handbook',
            'stock' => 25,
        ]);
    }

    public function test_student_can_add_product_to_cart_and_fetch_cart(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'is_active' => true,
        ]);
        $student = User::factory()->create([
            'role' => 'student',
            'is_active' => true,
        ]);

        Sanctum::actingAs($admin);
        $productId = $this->postJson('/api/v1/products', [
            'name' => 'API Testing Kit',
            'price' => 49.50,
            'stock' => 50,
            'is_active' => true,
        ])->json('data.id');

        Sanctum::actingAs($student);
        $addResponse = $this->postJson('/api/v1/cart/items', [
            'product_id' => $productId,
            'quantity' => 2,
        ]);

        $addResponse->assertOk();
        $addResponse->assertJsonPath('success', true);
        $this->assertEquals(99.0, (float) $addResponse->json('data.total'));
        $addResponse->assertJsonCount(1, 'data.items');

        $cartResponse = $this->getJson('/api/v1/cart/me');
        $cartResponse->assertOk();
        $cartResponse->assertJsonPath('success', true);
        $cartResponse->assertJsonPath('data.items.0.quantity', 2);
    }

    public function test_student_can_create_order_from_own_cart(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'is_active' => true,
        ]);
        $student = User::factory()->create([
            'role' => 'student',
            'is_active' => true,
        ]);

        Sanctum::actingAs($admin);
        $productId = $this->postJson('/api/v1/products', [
            'name' => 'Order Ready Product',
            'price' => 10.00,
            'stock' => 100,
            'is_active' => true,
        ])->json('data.id');

        Sanctum::actingAs($student);
        $this->postJson('/api/v1/cart/items', [
            'product_id' => $productId,
            'quantity' => 3,
        ])->assertOk();

        $cartId = $this->getJson('/api/v1/cart/me')->json('data.id');

        $orderResponse = $this->postJson('/api/v1/orders', [
            'cart_id' => $cartId,
            'shipping_address' => '123 API Street, Casablanca',
            'payment_method' => 'card',
            'notes' => 'Deliver between 9am and 5pm',
        ]);

        $orderResponse->assertCreated();
        $orderResponse->assertJsonPath('success', true);
        $orderResponse->assertJsonPath('data.cart_id', $cartId);
        $this->assertEquals(30.0, (float) $orderResponse->json('data.total'));
        $this->assertDatabaseHas('orders', [
            'cart_id' => $cartId,
            'user_id' => $student->id,
            'status' => 'pending',
        ]);
    }
}

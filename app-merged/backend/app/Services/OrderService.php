<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderService
{
    public function createFromCart(User $user, array $payload): Order
    {
        return DB::transaction(function () use ($user, $payload) {
            /** @var Cart $cart */
            $cart = Cart::query()
                ->with('items')
                ->lockForUpdate()
                ->findOrFail((int) $payload['cart_id']);

            if ((int) $cart->user_id !== (int) $user->id) {
                throw ValidationException::withMessages([
                    'cart_id' => ['You can only create orders from your own cart.'],
                ]);
            }

            if ($cart->status !== 'active') {
                throw ValidationException::withMessages([
                    'cart_id' => ['Only active carts can be checked out.'],
                ]);
            }

            if ($cart->items->isEmpty()) {
                throw ValidationException::withMessages([
                    'cart_id' => ['Cannot create an order from an empty cart.'],
                ]);
            }

            $order = Order::query()->create([
                'order_number' => 'ORD-'.now()->format('YmdHis').'-'.strtoupper((string) str()->random(6)),
                'user_id' => $user->id,
                'cart_id' => $cart->id,
                'status' => 'pending',
                'total' => (float) $cart->total,
                'shipping_address' => $payload['shipping_address'],
                'payment_method' => $payload['payment_method'],
                'notes' => $payload['notes'] ?? null,
            ]);

            $cart->forceFill(['status' => 'checked_out'])->save();

            return $order;
        });
    }
}

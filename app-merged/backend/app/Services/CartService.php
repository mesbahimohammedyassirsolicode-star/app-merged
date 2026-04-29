<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;

class CartService
{
    public function addProduct(User $user, int $productId, int $quantity): Cart
    {
        return DB::transaction(function () use ($user, $productId, $quantity) {
            /** @var Product|null $product */
            $product = Product::query()
                ->where('id', $productId)
                ->where('is_active', true)
                ->lockForUpdate()
                ->first();

            if (! $product) {
                throw (new ModelNotFoundException())->setModel(Product::class, [$productId]);
            }

            /** @var Cart $cart */
            $cart = Cart::query()->firstOrCreate(
                ['user_id' => $user->id, 'status' => 'active'],
                ['total' => 0]
            );

            $item = $cart->items()->where('product_id', $product->id)->first();
            if ($item) {
                $item->quantity += $quantity;
                $item->unit_price = $product->price;
                $item->subtotal = $item->quantity * $item->unit_price;
                $item->save();
            } else {
                $cart->items()->create([
                    'product_id' => $product->id,
                    'quantity' => $quantity,
                    'unit_price' => $product->price,
                    'subtotal' => $quantity * $product->price,
                ]);
            }

            $total = (float) $cart->items()->sum('subtotal');
            $cart->forceFill(['total' => $total])->save();

            return $cart->load('items');
        });
    }
}

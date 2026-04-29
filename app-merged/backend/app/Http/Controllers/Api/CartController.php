<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\AddToCartRequest;
use App\Http\Resources\CartResource;
use App\Services\CartService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Throwable;

class CartController extends BaseApiController
{
    public function __construct(
        private CartService $cartService
    ) {}

    public function add(AddToCartRequest $request): JsonResponse
    {
        try {
            $cart = $this->cartService->addProduct(
                $request->user(),
                (int) $request->validated('product_id'),
                (int) $request->validated('quantity')
            );

            return $this->success(
                CartResource::make($cart)->resolve(),
                [],
                'Product added to cart successfully.'
            );
        } catch (ModelNotFoundException) {
            return $this->error('Requested product was not found.', 404, [
                'product_id' => ['Requested product was not found.'],
            ]);
        } catch (Throwable $exception) {
            report($exception);

            return $this->error('Unable to add product to cart.', 500, [
                'server' => ['An unexpected error occurred.'],
            ]);
        }
    }

    public function me(): JsonResponse
    {
        $cart = \App\Models\Cart::query()
            ->with('items')
            ->where('user_id', auth()->id())
            ->where('status', 'active')
            ->first();

        if (! $cart) {
            return $this->success(null, [], 'No active cart found.');
        }

        return $this->success(
            CartResource::make($cart)->resolve(),
            [],
            'Cart fetched successfully.'
        );
    }
}

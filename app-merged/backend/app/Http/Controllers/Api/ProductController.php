<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\StoreProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Throwable;

class ProductController extends BaseApiController
{
    public function index(): JsonResponse
    {
        $products = Product::query()->where('is_active', true)->latest()->get();

        return $this->success(
            ProductResource::collection($products)->resolve(),
            [],
            'Products fetched successfully.'
        );
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        try {
            $product = Product::query()->create($request->validated());

            return $this->created(
                ProductResource::make($product)->resolve(),
                'Product created successfully.'
            );
        } catch (Throwable $exception) {
            report($exception);

            return $this->error('Unable to create product.', 500, [
                'server' => ['An unexpected error occurred.'],
            ]);
        }
    }
}

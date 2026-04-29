<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\CreateOrderRequest;
use App\Http\Resources\OrderResource;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Throwable;

class OrderController extends BaseApiController
{
    public function __construct(
        private OrderService $orderService
    ) {}

    public function store(CreateOrderRequest $request): JsonResponse
    {
        try {
            $order = $this->orderService->createFromCart($request->user(), $request->validated());

            return $this->created(
                OrderResource::make($order)->resolve(),
                'Order created successfully.'
            );
        } catch (ValidationException $exception) {
            return $this->error('Validation failed.', 422, $exception->errors());
        } catch (Throwable $exception) {
            report($exception);

            return $this->error('Unable to create order.', 500, [
                'server' => ['An unexpected error occurred.'],
            ]);
        }
    }
}

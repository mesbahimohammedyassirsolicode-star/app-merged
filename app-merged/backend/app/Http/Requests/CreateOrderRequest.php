<?php

namespace App\Http\Requests;

class CreateOrderRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'cart_id' => ['required', 'exists:carts,id'],
            'shipping_address' => ['required', 'string', 'max:1000'],
            'payment_method' => ['required', 'string', 'max:50'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'cart_id.required' => 'Cart id is required.',
            'cart_id.exists' => 'Selected cart does not exist.',
            'shipping_address.required' => 'Shipping address is required.',
            'shipping_address.max' => 'Shipping address may not exceed 1000 characters.',
            'payment_method.required' => 'Payment method is required.',
            'payment_method.max' => 'Payment method may not exceed 50 characters.',
            'notes.max' => 'Order notes may not exceed 1000 characters.',
        ];
    }
}

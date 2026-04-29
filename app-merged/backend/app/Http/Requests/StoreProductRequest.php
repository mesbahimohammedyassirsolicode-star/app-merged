<?php

namespace App\Http\Requests;

class StoreProductRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'stock' => ['required', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Product name is required.',
            'name.max' => 'Product name may not exceed 255 characters.',
            'price.required' => 'Product price is required.',
            'price.numeric' => 'Product price must be a valid number.',
            'price.min' => 'Product price must be greater than or equal to 0.',
            'stock.required' => 'Stock value is required.',
            'stock.integer' => 'Stock value must be an integer.',
            'stock.min' => 'Stock value must be greater than or equal to 0.',
            'is_active.boolean' => 'Active status must be true or false.',
        ];
    }
}

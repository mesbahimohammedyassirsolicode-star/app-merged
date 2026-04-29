<?php

namespace App\Http\Requests;

class UpdateModuleProgressRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'progression' => ['required', 'integer', 'min:0', 'max:100'],
            'last_session' => ['nullable', 'date'],
        ];
    }
}

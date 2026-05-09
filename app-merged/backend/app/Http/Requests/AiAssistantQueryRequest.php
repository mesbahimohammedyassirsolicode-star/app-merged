<?php

namespace App\Http\Requests;

class AiAssistantQueryRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'query' => ['required', 'string', 'min:3', 'max:300'],
        ];
    }
}

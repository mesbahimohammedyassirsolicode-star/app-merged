<?php

namespace App\Http\Requests;

class AnalyticsCopilotQueryRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'query' => ['required', 'string', 'min:3', 'max:500'],
            'conversation_id' => ['nullable', 'integer', 'exists:analytics_conversations,id'],
        ];
    }
}

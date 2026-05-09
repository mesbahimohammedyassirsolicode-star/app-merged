<?php

namespace App\Http\Requests;

class DashboardAnalyticsRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'module_id' => ['nullable', 'integer', 'exists:modules,id'],
            'group_id' => ['nullable', 'integer', 'exists:groupes,id'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
        ];
    }
}

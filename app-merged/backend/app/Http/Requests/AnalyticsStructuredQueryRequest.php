<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class AnalyticsStructuredQueryRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'metric' => ['required', 'string', Rule::in(array_keys(config('analytics.metrics', [])))],
            'dimension' => ['required', 'string', Rule::in(array_keys(config('analytics.dimensions', [])))],
            'filters' => ['nullable', 'array'],
            'filters.date_from' => ['nullable', 'date'],
            'filters.date_to' => ['nullable', 'date', 'after_or_equal:filters.date_from'],
            'filters.module_id' => ['nullable', 'integer', 'min:1'],
            'filters.group_id' => ['nullable', 'integer', 'min:1'],
        ];
    }
}

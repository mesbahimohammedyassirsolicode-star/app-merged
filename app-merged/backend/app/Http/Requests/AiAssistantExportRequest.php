<?php

namespace App\Http\Requests;

class AiAssistantExportRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'format' => ['required', 'string', 'in:pdf,csv'],
            'data' => ['required'],
            'summary' => ['required', 'string', 'max:2000'],
            'insights' => ['nullable', 'array'],
            'insights.*' => ['string', 'max:500'],
        ];
    }
}

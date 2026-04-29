<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ScheduleIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'week_start' => ['nullable', 'date'],
            'groupe_id' => ['nullable', 'integer', 'exists:groupes,id'],
            'filiere_id' => ['nullable', 'integer', 'exists:filieres,id'],
        ];
    }
}

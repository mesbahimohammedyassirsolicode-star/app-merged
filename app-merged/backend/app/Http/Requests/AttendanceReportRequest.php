<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AttendanceReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'period' => ['nullable', 'in:daily,weekly'],
            'date' => ['nullable', 'date'],
            'filiere_id' => ['nullable', 'integer', 'exists:filieres,id'],
            'group_id' => ['nullable', 'integer', 'exists:groupes,id'],
            'module_id' => ['nullable', 'integer', 'exists:modules,id'],
        ];
    }
}

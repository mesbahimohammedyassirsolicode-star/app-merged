<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class IndexAttendanceRequest extends FormRequest
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
            'module_id' => ['required', 'integer', 'exists:modules,id'],
            'group_id' => ['required', 'integer', 'exists:groupes,id'],
            'date' => ['nullable', 'date'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'status' => ['nullable', 'in:present,absent,late,retard'],
            'academic_year' => ['nullable', 'string', 'max:9'],
            'filiere_id' => ['nullable', 'integer', 'exists:filieres,id'],
        ];
    }
}

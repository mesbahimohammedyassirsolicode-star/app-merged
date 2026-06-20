<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AnalyticsFilterRequest extends FormRequest
{
    public function authorize()
    {
        return true; // Allow all users to make this request
    }

    public function rules()
    {
        return [
            'module_id' => 'nullable|exists:modules,id',
            'group_id' => 'nullable|exists:groups,id',
            'filiere_id' => 'nullable|exists:filieres,id',
            'semester_id' => 'nullable|exists:semesters,id',
            'date_start' => 'nullable|date|before_or_equal:date_end',
            'date_end' => 'nullable|date|after_or_equal:date_start',
        ];
    }

    public function messages()
    {
        return [
            'module_id.exists' => 'The selected module does not exist.',
            'group_id.exists' => 'The selected group does not exist.',
            'filiere_id.exists' => 'The selected Filière does not exist.',
            'semester_id.exists' => 'The selected semester does not exist.',
            'date_start.before_or_equal' => 'The start date must be before or equal to the end date.',
            'date_end.after_or_equal' => 'The end date must be after or equal to the start date.',
        ];
    }
}
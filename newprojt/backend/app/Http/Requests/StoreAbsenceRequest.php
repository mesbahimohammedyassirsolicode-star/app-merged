<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAbsenceRequest extends FormRequest
{
    public function authorize() { return true; }
    public function rules()
    {
        return [
            'eleve_id' => 'required|exists:eleves,id',
            'classe_id' => 'required|exists:classes,id',
            'date' => 'required|date',
            'seance' => 'required|string',
            'motif' => 'nullable|string',
            'justifiee' => 'boolean',
        ];
    }
}

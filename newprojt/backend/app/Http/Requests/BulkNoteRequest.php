<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BulkNoteRequest extends FormRequest
{
    public function authorize() { return true; }
    public function rules()
    {
        return [
            'matiere_id' => 'required|exists:matieres,id',
            'trimestre' => 'required|integer',
            'type_evaluation' => 'required|string',
            'notes' => 'required|array',
            'notes.*.eleve_id' => 'required|exists:eleves,id',
            'notes.*.valeur' => 'required|numeric|min:0|max:20',
        ];
    }
}

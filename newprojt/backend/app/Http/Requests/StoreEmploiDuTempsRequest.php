<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreEmploiDuTempsRequest extends FormRequest
{
    public function authorize() { return true; }
    public function rules()
    {
        return [
            'classe_id' => 'required|exists:classes,id',
            'enseignant_id' => 'required|exists:enseignants,id',
            'matiere_id' => 'required|exists:matieres,id',
            'jour_semaine' => 'required|integer|min:1|max:7',
            'heure_debut' => 'required|string',
            'heure_fin' => 'required|string',
            'salle' => 'nullable|string',
        ];
    }
}

<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateStageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'groupe_id' => 'nullable|exists:groupes,id',
            'formateur_id' => 'nullable|exists:formateurs,id',
            'organisation' => 'sometimes|string|max:255',
            'poste' => 'nullable|string|max:150',
            'date_debut' => 'sometimes|date',
            'date_fin' => 'sometimes|date|after_or_equal:date_debut',
            'status' => 'sometimes|in:en_cours,valide,non_valide',
            'note' => 'nullable|numeric|min:0|max:20',
            'observation' => 'nullable|string',
            'rapport_path' => 'nullable|string',
        ];
    }
}

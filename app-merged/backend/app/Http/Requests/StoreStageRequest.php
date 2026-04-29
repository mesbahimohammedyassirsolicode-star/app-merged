<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreStageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'stagiaire_id' => 'required|exists:stagiaires,id',
            'groupe_id' => 'nullable|exists:groupes,id',
            'formateur_id' => 'nullable|exists:formateurs,id',
            'organisation' => 'required|string|max:255',
            'poste' => 'nullable|string|max:150',
            'date_debut' => 'required|date',
            'date_fin' => 'required|date|after_or_equal:date_debut',
            'status' => 'nullable|in:en_cours,valide,non_valide',
        ];
    }
}

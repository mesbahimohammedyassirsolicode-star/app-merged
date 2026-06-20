<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEleveRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'nom' => 'sometimes|string|max:255',
            'prenom' => 'sometimes|string|max:255',
            'code_massar' => 'sometimes|string|unique:eleves,code_massar,' . $this->route('eleve'),
            'date_naissance' => 'sometimes|date',
            'classe_id' => 'sometimes|exists:classes,id',
            'statut' => 'sometimes|string',
            'adresse' => 'nullable|string',
        ];
    }
}

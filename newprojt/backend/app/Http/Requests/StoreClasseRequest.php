<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreClasseRequest extends FormRequest
{
    public function authorize() { return true; }
    public function rules()
    {
        return [
            'name' => 'required|string|max:255',
            'niveau_id' => 'required|exists:niveaux,id',
            'enseignant_principal_id' => 'nullable|exists:enseignants,id',
            'capacite_max' => 'nullable|integer',
        ];
    }
}

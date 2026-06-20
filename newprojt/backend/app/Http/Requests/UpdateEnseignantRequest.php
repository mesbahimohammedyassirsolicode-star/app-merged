<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEnseignantRequest extends FormRequest
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
            'email' => 'sometimes|email|unique:users,email,' . $this->route('enseignant')->user_id,
            'cin' => 'sometimes|string|unique:enseignants,cin,' . $this->route('enseignant')->id,
            'matiere' => 'sometimes|string',
            'telephone' => 'nullable|string',
        ];
    }
}

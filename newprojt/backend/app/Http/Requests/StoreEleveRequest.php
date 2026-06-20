<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreEleveRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'nom' => 'required|string|max:255',
            'prenom' => 'required|string|max:255',
            'code_massar' => 'required|string|unique:eleves,code_massar',
            'date_naissance' => 'required|date',
            'classe_id' => 'required|exists:classes,id',
            'statut' => 'nullable|string',
            'adresse' => 'nullable|string',
        ];
    }
}

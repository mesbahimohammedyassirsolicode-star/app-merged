<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePaiementRequest extends FormRequest
{
    public function authorize() { return true; }
    public function rules()
    {
        return [
            'eleve_id' => 'required|exists:eleves,id',
            'mois' => 'required|string',
            'montant' => 'required|numeric',
            'mode_paiement' => 'required|string',
            'date_paiement' => 'required|date',
            'statut' => 'required|string|in:paye,impaye,partiel',
            'note' => 'nullable|string',
        ];
    }
}

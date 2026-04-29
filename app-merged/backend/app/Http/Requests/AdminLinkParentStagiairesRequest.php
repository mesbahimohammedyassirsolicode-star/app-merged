<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class AdminLinkParentStagiairesRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'stagiaire_ids' => ['required', 'array'],
            'stagiaire_ids.*' => [
                'integer',
                'distinct',
                Rule::exists('stagiaires', 'id')->whereNull('deleted_at'),
            ],
        ];
    }
}

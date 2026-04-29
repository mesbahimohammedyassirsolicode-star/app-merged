<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class LinkParentStagiairesRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->role === 'parent';
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

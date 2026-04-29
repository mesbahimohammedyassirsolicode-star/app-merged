<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSeanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        $role = $this->user()?->role;

        return in_array($role, ['admin', 'directeur', 'secretariat', 'formateur', 'teacher']);
    }

    public function rules(): array
    {
        $rules = [
            'module_id' => ['sometimes', 'integer', 'exists:modules,id'],
            // Nullable to support switching a schedule entry to global scope.
            'groupe_id' => ['sometimes', 'nullable', 'integer', 'exists:groupes,id'],
            'filiere_id' => ['sometimes', 'nullable', 'integer', 'exists:filieres,id'],
            'date' => ['sometimes', 'date'],
            'start_time' => ['sometimes', 'date_format:H:i'],
            'end_time' => ['sometimes', 'date_format:H:i', 'after:start_time'],
            'salle' => ['nullable', 'string', 'max:20'],
            'type' => ['nullable', 'in:presentiel,distance'],
            'status' => ['nullable', 'in:planifie,realise,annule'],
        ];

        $role = $this->user()?->role;
        if (in_array($role, ['admin', 'directeur', 'secretariat'])) {
            $rules['user_id'] = ['nullable', 'integer', 'exists:users,id'];
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'end_time.after' => 'L\'heure de fin doit être après l\'heure de début.',
        ];
    }
}

<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSeanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        $role = $this->user()?->role;

        return in_array($role, ['admin', 'directeur', 'secretariat', 'formateur', 'teacher']);
    }

    public function rules(): array
    {
        $rules = [
            'module_id' => ['required', 'integer', 'exists:modules,id'],
            // `groupe_id` nullable allows filière-wide or school-wide rows; pair with `filiere_id` when scoping.
            'groupe_id' => ['nullable', 'integer', 'exists:groupes,id'],
            'filiere_id' => ['nullable', 'integer', 'exists:filieres,id'],
            'date' => ['required', 'date'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'salle' => ['nullable', 'string', 'max:20'],
            'type' => ['nullable', 'in:presentiel,distance'],
            'status' => ['nullable', 'in:planifie,realise,annule'],
        ];

        // Only admins/secretariat can assign to another formateur;
        // formateurs are auto-assigned to themselves in the controller.
        $role = $this->user()?->role;
        if (in_array($role, ['admin', 'directeur', 'secretariat'])) {
            $rules['user_id'] = ['nullable', 'integer', 'exists:users,id'];
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'module_id.required' => 'Le module est obligatoire.',
            'module_id.exists' => 'Module introuvable.',
            'groupe_id.exists' => 'Groupe introuvable.',
            'date.required' => 'La date est obligatoire.',
            'start_time.required' => 'L\'heure de début est obligatoire.',
            'end_time.required' => 'L\'heure de fin est obligatoire.',
            'end_time.after' => 'L\'heure de fin doit être après l\'heure de début.',
        ];
    }
}

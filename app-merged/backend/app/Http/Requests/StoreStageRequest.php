<?php

namespace App\Http\Requests;

use App\Models\Formateur;
use App\Models\Stage;
use App\Services\ObjectScopeService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\Gate;

class StoreStageRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        if (! $user || ! Gate::forUser($user)->allows('create', Stage::class)) {
            return false;
        }

        $stagiaireId = (int) $this->input('stagiaire_id');
        if ($stagiaireId > 0) {
            try {
                app(ObjectScopeService::class)->findScopedStagiaireOrFail($user, $stagiaireId);
            } catch (AuthorizationException) {
                return false;
            }
        }

        if (! in_array((string) $user->role, ['teacher', 'formateur'], true)) {
            return true;
        }

        $formateurId = (int) $this->input('formateur_id');
        if ($formateurId <= 0) {
            return true;
        }

        return Formateur::query()
            ->whereKey($formateurId)
            ->where('user_id', (int) $user->id)
            ->exists();
    }

    /**
     * @return array<string, mixed>
     */
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

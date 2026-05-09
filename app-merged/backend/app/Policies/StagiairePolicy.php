<?php

namespace App\Policies;

use App\Models\Stagiaire;
use App\Models\User;
use App\Services\ObjectScopeService;

/**
 * Authorization for stagiaire records — used for parent–child boundaries.
 */
class StagiairePolicy
{
    public function __construct(
        private ObjectScopeService $objectScopeService
    ) {}

    public function viewReport(User $user, Stagiaire $stagiaire): bool
    {
        try {
            return $this->objectScopeService->findScopedStagiaireOrFail($user, (int) $stagiaire->id)->id === $stagiaire->id;
        } catch (\Throwable) {
            return false;
        }
    }

    /**
     * Parent may only access stagiaires linked via parent_stagiaire pivot (see StudentParent::stagiaires).
     */
    public function parentCanView(User $user, Stagiaire $stagiaire): bool
    {
        if ($user->role !== 'parent') {
            return false;
        }

        return $user->parent?->children()->where('stagiaires.id', $stagiaire->id)->exists() ?? false;
    }
}

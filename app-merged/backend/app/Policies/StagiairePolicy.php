<?php

namespace App\Policies;

use App\Models\Stagiaire;
use App\Models\User;

/**
 * Authorization for stagiaire records — used for parent–child boundaries.
 */
class StagiairePolicy
{
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

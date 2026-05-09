<?php

namespace App\Policies;

use App\Models\Filiere;
use App\Models\User;
use App\Services\ObjectScopeService;

class FilierePolicy
{
    public function __construct(
        private ObjectScopeService $objectScopeService
    ) {}

    public function viewAny(User $user): bool
    {
        return in_array((string) $user->role, ['admin', 'directeur', 'secretariat', 'teacher', 'formateur', 'student', 'stagiaire', 'parent'], true);
    }

    public function view(User $user, Filiere $filiere): bool
    {
        try {
            $this->objectScopeService->assertCanReadTimetableCode($user, (string) $filiere->code);

            return true;
        } catch (\Throwable) {
            return false;
        }
    }
}

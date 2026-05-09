<?php

namespace App\Policies;

use App\Models\Stage;
use App\Models\User;
use App\Services\ObjectScopeService;

class StagePolicy
{
    public function __construct(
        private ObjectScopeService $objectScopeService
    ) {}

    public function viewAny(User $user): bool
    {
        return in_array((string) $user->role, ['admin', 'directeur', 'secretariat', 'teacher', 'formateur', 'student', 'stagiaire'], true);
    }

    public function view(User $user, Stage $stage): bool
    {
        return $this->objectScopeService->scopeStagesFor($user)
            ->whereKey($stage->id)
            ->exists();
    }

    public function create(User $user): bool
    {
        return in_array((string) $user->role, ['admin', 'directeur', 'secretariat', 'teacher', 'formateur'], true);
    }

    public function update(User $user, Stage $stage): bool
    {
        return $this->view($user, $stage);
    }

    public function delete(User $user, Stage $stage): bool
    {
        return $this->view($user, $stage);
    }
}

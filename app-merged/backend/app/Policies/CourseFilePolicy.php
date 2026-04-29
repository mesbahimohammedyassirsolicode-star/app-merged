<?php

namespace App\Policies;

use App\Models\CourseFile;
use App\Models\User;
use App\Services\CourseFileService;

class CourseFilePolicy
{
    public function __construct(
        private CourseFileService $courseFileService
    ) {}

    public function before(User $user, string $ability): ?bool
    {
        if (in_array((string) $user->role, ['admin', 'directeur', 'secretariat'], true)) {
            return true;
        }

        return null;
    }

    public function viewAny(User $user): bool
    {
        return $this->canUseFeature($user);
    }

    public function view(User $user, CourseFile $courseFile): bool
    {
        if (! $this->canUseFeature($user)) {
            return false;
        }

        return $this->courseFileService->canView($user, $courseFile);
    }

    public function create(User $user): bool
    {
        return in_array((string) $user->role, ['admin', 'directeur', 'secretariat', 'teacher', 'formateur'], true);
    }

    public function delete(User $user, CourseFile $courseFile): bool
    {
        if (in_array((string) $user->role, ['admin', 'directeur', 'secretariat'], true)) {
            return true;
        }

        return (int) $courseFile->uploaded_by_user_id === (int) $user->id;
    }

    private function canUseFeature(User $user): bool
    {
        return in_array((string) $user->role, [
            'admin', 'directeur', 'secretariat', 'teacher', 'formateur', 'student', 'stagiaire', 'parent',
        ], true);
    }
}

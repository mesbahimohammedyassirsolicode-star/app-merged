<?php

namespace App\Policies;

use App\Models\Evaluation;
use App\Models\User;

class EvaluationPolicy
{
    public function before(User $user, string $ability): ?bool
    {
        if ($this->isStaff($user)) {
            return true;
        }

        return null;
    }

    public function viewAny(User $user): bool
    {
        return $this->isTeacher($user) || $this->isStudent($user) || $this->isParent($user);
    }

    public function create(User $user): bool
    {
        return $this->isTeacher($user);
    }

    public function view(User $user, Evaluation $evaluation): bool
    {
        if ($this->isTeacher($user)) {
            return (int) $evaluation->user_id === (int) $user->id;
        }

        if ($this->isStudent($user)) {
            $stagiaireId = (int) ($user->stagiaire?->id ?? 0);

            return $stagiaireId > 0
                && $evaluation->notes()->where('stagiaire_id', $stagiaireId)->exists();
        }

        if ($this->isParent($user)) {
            $childIds = $this->linkedChildIds($user);

            return ! empty($childIds)
                && $evaluation->notes()->whereIn('stagiaire_id', $childIds)->exists();
        }

        return false;
    }

    public function update(User $user, Evaluation $evaluation): bool
    {
        return $this->isTeacher($user) && (int) $evaluation->user_id === (int) $user->id;
    }

    public function delete(User $user, Evaluation $evaluation): bool
    {
        return $this->update($user, $evaluation);
    }

    public function viewNotes(User $user, Evaluation $evaluation): bool
    {
        return $this->isTeacher($user) && (int) $evaluation->user_id === (int) $user->id;
    }

    /**
     * @return array<int>
     */
    private function linkedChildIds(User $user): array
    {
        return $user->parent?->children()
            ->pluck('stagiaires.id')
            ->map(fn ($id) => (int) $id)
            ->all() ?? [];
    }

    private function isStaff(User $user): bool
    {
        return in_array((string) $user->role, ['admin', 'directeur', 'secretariat'], true);
    }

    private function isTeacher(User $user): bool
    {
        return in_array((string) $user->role, ['teacher', 'formateur'], true);
    }

    private function isStudent(User $user): bool
    {
        return in_array((string) $user->role, ['student', 'stagiaire'], true);
    }

    private function isParent(User $user): bool
    {
        return $user->role === 'parent';
    }
}

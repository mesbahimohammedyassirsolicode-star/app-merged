<?php

namespace App\Policies;

use App\Models\Note;
use App\Models\User;

class NotePolicy
{
    public function before(User $user, string $ability): ?bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        return null;
    }

    public function viewAny(User $user): bool
    {
        return true; // Filtered in controller
    }

    public function view(User $user, Note $note): bool
    {
        if ($user->role === 'teacher') {
            return (int) $note->evaluation->affectation->formateur->user_id === (int) $user->id;
        }

        if ($user->role === 'student') {
            return (int) $note->stagiaire->user_id === (int) $user->id;
        }

        if ($user->role === 'parent') {
            return $user->parent->children()->where('stagiaires.id', $note->stagiaire_id)->exists();
        }

        return false;
    }

    public function create(User $user): bool
    {
        return $user->role === 'teacher';
    }

    public function update(User $user, Note $note): bool
    {
        return $user->role === 'teacher'
            && (int) $note->evaluation->affectation->formateur->user_id === (int) $user->id;
    }

    public function delete(User $user, Note $note): bool
    {
        return $user->role === 'teacher'
            && (int) $note->evaluation->affectation->formateur->user_id === (int) $user->id;
    }
}

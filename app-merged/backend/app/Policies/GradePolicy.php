<?php

namespace App\Policies;

use App\Models\Module;
use App\Models\User;

class GradePolicy
{
    public function update(User $user, Module $module): bool
    {
        return $module->trainers()
            ->where('users.id', $user->id)
            ->exists();
    }
}

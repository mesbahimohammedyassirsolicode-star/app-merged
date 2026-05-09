<?php

namespace App\Services;

use App\Models\User;
use Exception;
use Illuminate\Support\Facades\Auth;

class AuthService
{
    /**
     * Attempt login and return the token and user data.
     *
     * @return array|null Null on failure, array with user etc. on success.
     */
    public function login(array $credentials): ?array
    {
        if (! Auth::attempt($credentials)) {
            return null;
        }

        /** @var User $user */
        $user = Auth::user();

        if (! $user->is_active) {
            Auth::logout();
            throw new Exception('Compte désactivé. Contactez l\'administration.', 403);
        }

        $this->loadUserProfile($user);
        $user->load(['roles.permissions:id,slug']);
        $permissions = $user->effectivePermissionSlugs();
        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'access_token' => $token,
            'token_type' => 'Bearer',
            'role' => (string) $user->role,
            'user' => $user,
            'roles' => $user->roles,
            'permissions' => $permissions->all(),
        ];
    }

    /**
     * Load the extra profile associations onto the user model based on role.
     */
    public function loadUserProfile(User $user): void
    {
        try {
            $role = strtolower((string) $user->role);
            match ($role) {
                'admin', 'directeur', 'secretariat' => $user->loadMissing('administrator'),
                'teacher', 'formateur' => $user->loadMissing('formateur'),
                'student', 'stagiaire' => $user->loadMissing('stagiaire.filiere', 'stagiaire.groupes'),
                'parent' => $user->loadMissing('parent'),
                default => null,
            };
        } catch (\Throwable $e) {
            report($e);
        }
    }

    /**
     * Get the authenticated user's profile with roles and permissions.
     */
    public function getUserProfileData(User $user): array
    {
        $this->loadUserProfile($user);
        $user->load(['roles.permissions:id,slug']);
        $permissions = $user->effectivePermissionSlugs();

        return [
            'role' => (string) $user->role,
            'user' => $user,
            'roles' => $user->roles,
            'permissions' => $permissions->all(),
        ];
    }
}

<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Canonical roles supported by the API.
     * Keep this list centralized to scale with future roles.
     */
    private const ALLOWED_ROLES = [
        'admin',
        'directeur',
        'secretariat',
        'trainer',
        'teacher',
        'formateur',
        'student',
        'stagiaire',
        'parent',
    ];

    /**
     * Canonical RBAC aliases.
     *
     * - trainer => teacher|formateur
     * - student => student|stagiaire
     */
    private const ROLE_ALIASES = [
        'trainer' => ['trainer', 'teacher', 'formateur'],
        'student' => ['student', 'stagiaire'],
        'admin' => ['admin'],
        'parent' => ['parent'],
    ];

    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();
        $allowedRoles = $this->flattenRoles($roles);

        if (! $user) {
            return response()->json(['message' => 'Non authentifie.'], Response::HTTP_UNAUTHORIZED);
        }

        if ($allowedRoles === []) {
            return response()->json(['message' => 'Configuration de role invalide.'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        foreach ($allowedRoles as $allowedRole) {
            if (! in_array($allowedRole, self::ALLOWED_ROLES, true)) {
                return response()->json(['message' => 'Configuration de role invalide.'], Response::HTTP_INTERNAL_SERVER_ERROR);
            }
        }

        $userRole = $this->resolveUserRole($user);
        if ($userRole === null) {
            return response()->json(['message' => 'Role utilisateur invalide.'], Response::HTTP_FORBIDDEN);
        }

        if (! $this->hasAnyRole($userRole, $allowedRoles)) {
            return response()->json(['message' => 'Acces refuse.'], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }

    /**
     * Use the primary role column as single source of truth.
     * Fallback to the first related role slug only when role is missing.
     */
    private function resolveUserRole(object $user): ?string
    {
        $role = strtolower(trim((string) ($user->role ?? '')));
        if ($role !== '' && in_array($role, self::ALLOWED_ROLES, true)) {
            return $role;
        }

        $relatedRole = strtolower(trim((string) optional($user->roles()->select('slug')->first())->slug));
        if ($relatedRole !== '' && in_array($relatedRole, self::ALLOWED_ROLES, true)) {
            return $relatedRole;
        }

        return null;
    }

    /**
     * Accept middleware params in both "role:a,b" and variadic formats.
     *
     * @param  array<int, string>  $roles
     * @return array<int, string>
     */
    private function flattenRoles(array $roles): array
    {
        $resolved = [];

        foreach ($roles as $roleSet) {
            foreach (array_map('trim', explode(',', (string) $roleSet)) as $role) {
                if ($role !== '') {
                    $resolved[] = strtolower($role);
                }
            }
        }

        return array_values(array_unique($resolved));
    }

    /**
     * @param  array<int, string>  $allowedRoles
     */
    private function hasAnyRole(string $userRole, array $allowedRoles): bool
    {
        foreach ($allowedRoles as $allowedRole) {
            $resolved = self::ROLE_ALIASES[$allowedRole] ?? [$allowedRole];
            if (in_array($userRole, $resolved, true)) {
                return true;
            }
        }

        return false;
    }
}

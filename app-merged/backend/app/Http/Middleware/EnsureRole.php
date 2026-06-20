<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    private const ALLOWED_ROLES = [
        'admin',
        'directeur',
        'secretariat',
        'teacher',
        'formateur',
        'student',
        'stagiaire',
        'parent',
    ];

    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();
        $allowed = [];

        foreach ($roles as $role) {
            foreach (array_map('trim', explode(',', (string) $role)) as $candidate) {
                if ($candidate !== '') {
                    $allowed[] = $candidate;
                }
            }
        }

        $allowed = array_values(array_unique($allowed));

        if (! $user) {
            return response()->json(['message' => 'Non authentifié.'], 401);
        }

        foreach ($allowed as $allowedRole) {
            if (! in_array($allowedRole, self::ALLOWED_ROLES, true)) {
                return response()->json(['message' => 'Configuration de role invalide.'], 500);
            }
        }

        if (! method_exists($user, 'canonicalRole') || ! method_exists($user, 'hasAnyRole')) {
            return response()->json(['message' => 'Role utilisateur invalide.'], 403);
        }

        $userRole = $user->canonicalRole();
        if (! in_array($userRole, self::ALLOWED_ROLES, true)) {
            return response()->json(['message' => 'Role utilisateur invalide.'], 403);
        }

        if ($user->hasAnyRole(...$allowed)) {
            return $next($request);
        }

        return response()->json(['message' => 'Accès refusé.'], 403);
    }
}

<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePermission
{
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        if (! $request->user()) {
            return response()->json(['message' => 'Non authentifié.'], 401);
        }

        if ($request->user()->hasPermission($permission)) {
            return $next($request);
        }

        return response()->json(['message' => 'Accès refusé.'], 403);
    }
}

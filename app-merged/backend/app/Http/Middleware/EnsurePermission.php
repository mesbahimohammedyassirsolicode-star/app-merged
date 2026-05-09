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
            return response()->json([
                'success' => false,
                'message' => 'Non authentifie.',
                'errors' => (object) [],
            ], 401);
        }

        if ($request->user()->hasEffectivePermission($permission)) {
            return $next($request);
        }

        return response()->json([
            'success' => false,
            'message' => 'Acces refuse.',
            'errors' => (object) [],
        ], 403);
    }
}

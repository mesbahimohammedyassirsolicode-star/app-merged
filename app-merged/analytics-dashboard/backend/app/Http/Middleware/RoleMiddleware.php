<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @param  string  $role
     * @return mixed
     */
    public function handle(Request $request, Closure $next, string $role)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        switch ($role) {
            case 'teacher':
                if (!$user->isTeacher()) {
                    return response()->json(['message' => 'Forbidden'], 403);
                }
                break;

            case 'student':
                if (!$user->isStudent()) {
                    return response()->json(['message' => 'Forbidden'], 403);
                }
                break;

            case 'parent':
                if (!$user->isParent()) {
                    return response()->json(['message' => 'Forbidden'], 403);
                }
                break;

            case 'admin':
                if (!$user->isAdmin()) {
                    return response()->json(['message' => 'Forbidden'], 403);
                }
                break;

            default:
                return response()->json(['message' => 'Role not recognized'], 400);
        }

        return $next($request);
    }
}
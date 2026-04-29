<?php

namespace App\Http\Controllers;

use App\Models\AnneeScolaire;
use App\Services\DashboardService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class DashboardController extends Controller
{
    public function __construct(
        private DashboardService $dashboardService
    ) {}

    /**
     * GET /api/v1/dashboard
     * Single endpoint: returns role-specific payload. Backend decides content via Strategy Pattern.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $role = $user->role;

        if ($role === null || $role === '') {
            return $this->error('Role utilisateur non defini.', 403);
        }

        try {
            $anneeId = AnneeScolaire::where('is_current', true)->value('id') ?? 0;
            $cacheKey = "dashboard_{$role}_{$user->id}_{$anneeId}";

            $payload = Cache::remember($cacheKey, 60, function () use ($role, $user) {
                return $this->dashboardService->getDashboardPayload($user, $role);
            });
        } catch (\Throwable $e) {
            report($e);

            return $this->error(
                config('app.debug') ? $e->getMessage() : 'Erreur lors du chargement du tableau de bord.',
                500
            );
        }

        if ($payload === null) {
            return $this->error('Role non reconnu pour le tableau de bord.', 403);
        }

        return $this->success([
            'role' => (string) $role,
            'data' => $payload,
        ]);
    }
}

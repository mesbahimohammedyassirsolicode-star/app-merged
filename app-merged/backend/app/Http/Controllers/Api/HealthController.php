<?php

namespace App\Http\Controllers\Api;

use Illuminate\Support\Facades\DB;

class HealthController extends BaseApiController
{
    /**
     * GET /api/v1/health
     * Lightweight health check: app up + optional DB check.
     */
    public function index()
    {
        $checks = ['app' => 'ok'];
        try {
            DB::connection()->getPdo();
            $checks['database'] = 'ok';
        } catch (\Throwable $e) {
            $checks['database'] = 'error';
        }

        $healthy = $checks['database'] === 'ok';

        return response()->json([
            'data' => [
                'status' => $healthy ? 'healthy' : 'degraded',
                'checks' => $checks,
            ],
        ], $healthy ? 200 : 503);
    }
}

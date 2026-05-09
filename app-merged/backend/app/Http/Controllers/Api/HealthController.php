<?php

namespace App\Http\Controllers\Api;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

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

    /**
     * GET /api/v1/health/trainer-assignments
     * Readiness check for trainer assignment data isolation dependencies.
     */
    public function trainerAssignments()
    {
        $tables = [
            'module_trainer',
            'formateur_module',
            'teacher_module',
            'formateurs',
        ];

        $tableChecks = [];
        foreach ($tables as $table) {
            $tableChecks[$table] = Schema::hasTable($table) ? 'ok' : 'missing';
        }

        $data = [
            'module_trainer_rows' => Schema::hasTable('module_trainer')
                ? (int) DB::table('module_trainer')->count()
                : 0,
            'formateur_module_rows' => Schema::hasTable('formateur_module')
                ? (int) DB::table('formateur_module')->count()
                : 0,
            'teacher_module_rows' => Schema::hasTable('teacher_module')
                ? (int) DB::table('teacher_module')->count()
                : 0,
        ];

        $schemaReady = ! in_array('missing', $tableChecks, true);
        $assignmentsPresent = ($data['module_trainer_rows'] + $data['formateur_module_rows'] + $data['teacher_module_rows']) > 0;
        $status = $schemaReady && $assignmentsPresent ? 'ready' : 'degraded';

        return response()->json([
            'data' => [
                'status' => $status,
                'checks' => [
                    'schema' => $schemaReady ? 'ok' : 'degraded',
                    'tables' => $tableChecks,
                    'assignments' => $assignmentsPresent ? 'ok' : 'empty',
                ],
                'metrics' => $data,
            ],
        ], $status === 'ready' ? 200 : 503);
    }
}

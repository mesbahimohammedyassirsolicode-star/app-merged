<?php

use App\Http\Controllers\Api\AttendanceApiController;
use App\Http\Controllers\Api\AttendanceRiskController;
use App\Http\Controllers\Api\ParentScopeController;
use App\Http\Controllers\Api\ProgressController;
use App\Http\Controllers\ReportController;
use Illuminate\Support\Facades\Route;

/**
 * Domain: Students
 * Allowed roles: all roles, staff roles, parent (endpoint-specific)
 * Auth requirements: sanctum auth required for all routes
 */
Route::prefix('v1')->middleware(['auth:sanctum', 'throttle:60,1'])->group(function () use ($allRoles, $staffRoles, $studentRoles) {
    Route::scopeBindings()->group(function () use ($allRoles, $staffRoles, $studentRoles) {
        Route::get('/groups/{group}/attendance-summary', [AttendanceRiskController::class, 'summaryByGroup'])->middleware('role:'.$staffRoles);
        Route::get('/stagiaires/{stagiaire}/attendance-summary', [AttendanceRiskController::class, 'summaryByStagiaire'])->middleware('role:'.$allRoles);

        Route::get('/attendance/me', [AttendanceApiController::class, 'me'])->middleware('role:'.$studentRoles);
        Route::get('/attendance/child/{studentId}', [AttendanceApiController::class, 'child'])->middleware('role:parent');

        Route::get('/stagiaires/{stagiaire}/progress', [ProgressController::class, 'index'])->middleware('role:'.$allRoles);
        Route::get('/students/{id}/report', [ReportController::class, 'studentReport'])->middleware('role:'.$allRoles);
    });

    Route::middleware('role:parent')->prefix('parent')->group(function () {
        Route::get('/children', [ParentScopeController::class, 'children']);
        Route::get('/stagiaires', [ParentScopeController::class, 'stagiaires']);
        Route::get('/stagiaire/{stagiaire}', [ParentScopeController::class, 'show']);
        Route::get('/children/{stagiaire}/grades', [ParentScopeController::class, 'grades']);
        Route::get('/children/{stagiaire}/attendance', [ParentScopeController::class, 'attendance']);
    });
});

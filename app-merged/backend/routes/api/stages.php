<?php

use App\Http\Controllers\Api\StageController;
use Illuminate\Support\Facades\Route;

/**
 * Domain: Stages (Internships)
 * Allowed roles: staff roles for read/write, admin roles for delete
 * Auth requirements: sanctum auth required for all routes
 */
Route::prefix('v1')->middleware(['auth:sanctum', 'throttle:60,1'])->group(function () use ($staffRoles, $adminRoles) {
    Route::scopeBindings()->group(function () use ($staffRoles) {
        Route::get('/stages', [StageController::class, 'index'])->middleware('role:'.$staffRoles);
        Route::get('/stages/{stage}', [StageController::class, 'show'])->middleware('role:'.$staffRoles);
        Route::post('/stages', [StageController::class, 'store'])->middleware('role:'.$staffRoles);
        Route::put('/stages/{stage}', [StageController::class, 'update'])->middleware('role:'.$staffRoles);
    });

    Route::delete('/stages/{stage}', [StageController::class, 'destroy'])->middleware('role:'.$adminRoles);
});

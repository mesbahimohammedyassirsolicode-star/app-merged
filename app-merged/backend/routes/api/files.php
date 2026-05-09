<?php

use App\Http\Controllers\Api\CourseFileController;
use Illuminate\Support\Facades\Route;

/**
 * Domain: Course Files
 * Allowed roles: all roles (read/download/delete), staff roles (upload)
 * Auth requirements: sanctum auth required for all routes
 */
Route::prefix('v1')->middleware(['auth:sanctum', 'throttle:60,1'])->group(function () use ($allRoles, $staffRoles) {
    Route::scopeBindings()->group(function () use ($allRoles, $staffRoles) {
        Route::get('/course-files', [CourseFileController::class, 'index'])->middleware('role:'.$allRoles);
        Route::post('/course-files', [CourseFileController::class, 'store'])->middleware('role:'.$staffRoles);
        Route::get('/course-files/{courseFile}/download', [CourseFileController::class, 'download'])->middleware('role:'.$allRoles);
        Route::delete('/course-files/{courseFile}', [CourseFileController::class, 'destroy'])->middleware('role:'.$allRoles);
    });
});

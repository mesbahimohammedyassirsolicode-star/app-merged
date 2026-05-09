<?php

use App\Http\Controllers\Api\ScheduleController;
use App\Http\Controllers\Api\StagiairePortalController;
use App\Http\Controllers\Api\TimetableController;
use App\Http\Controllers\Api\TimetableDataController;
use Illuminate\Support\Facades\Route;

/**
 * Domain: Timetable
 * Allowed roles: all roles/student roles/staff roles (endpoint-specific)
 * Auth requirements: sanctum auth required for all routes
 */
Route::prefix('v1')->middleware(['auth:sanctum', 'throttle:60,1'])->group(function () use ($allRoles, $studentRoles) {
    Route::scopeBindings()->group(function () use ($allRoles, $studentRoles) {
        Route::get('/timetable', [TimetableController::class, 'index'])->middleware('role:admin,directeur,secretariat,teacher,formateur,student,stagiaire');
        Route::get('/emploi-du-temps', [TimetableController::class, 'index'])->middleware('role:admin,directeur,secretariat,teacher,formateur,student,stagiaire');
        Route::get('/schedules', [ScheduleController::class, 'index'])->middleware('role:admin,directeur,secretariat,teacher,formateur,student,stagiaire');

        Route::middleware('role:'.$studentRoles)->prefix('stagiaire')->group(function () {
            Route::get('/timetable', [StagiairePortalController::class, 'timetable']);
        });

        Route::get('/timetable-data/filieres', [TimetableDataController::class, 'filieres'])->middleware('role:'.$allRoles);
        Route::get('/timetable-data', [TimetableDataController::class, 'index'])->middleware('role:'.$allRoles);

        Route::post('/timetable', [TimetableController::class, 'store'])->middleware('role:admin,directeur,secretariat,teacher,formateur');
        Route::put('/timetable/{seance}', [TimetableController::class, 'update'])->middleware('role:admin,directeur,secretariat,teacher,formateur');
        Route::delete('/timetable/{seance}', [TimetableController::class, 'destroy'])->middleware('role:admin,directeur,secretariat,teacher,formateur');
    });
});

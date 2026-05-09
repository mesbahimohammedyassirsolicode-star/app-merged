<?php

use App\Http\Controllers\AffectationController;
use App\Http\Controllers\Api\GradesSummaryController;
use App\Http\Controllers\Api\TrainerGradeEntryController;
use App\Http\Controllers\EvaluationController;
use App\Http\Controllers\GradeController;
use Illuminate\Support\Facades\Route;

/**
 * Domain: Grades
 * Allowed roles: staff, teacher/formateur, admin/trainer, all roles (specific endpoints)
 * Auth requirements: sanctum auth required for all routes
 */
Route::prefix('v1')->middleware(['auth:sanctum', 'throttle:60,1'])->group(function () use ($allRoles, $staffRoles, $teacherRoles, $rbacAdminTrainerRoles) {
    Route::scopeBindings()->group(function () use ($allRoles, $staffRoles, $teacherRoles, $rbacAdminTrainerRoles) {
        Route::get('/trainer/grade-entry-data', [TrainerGradeEntryController::class, 'data'])->middleware('role:'.$teacherRoles);
        Route::post('/trainer/grades', [TrainerGradeEntryController::class, 'store'])->middleware('role:'.$teacherRoles);

        Route::get('/affectations', [AffectationController::class, 'index'])->middleware('role:'.$staffRoles);
        Route::get('/affectations/{affectation}', [AffectationController::class, 'show'])->middleware('role:'.$staffRoles);
        Route::get('/affectations/{affectation}/grades-summary', [GradesSummaryController::class, 'summaryByAffectation'])->middleware('role:'.$staffRoles);
        Route::get('/stagiaires/{stagiaire}/grades-summary', [GradesSummaryController::class, 'summaryByStagiaire'])->middleware('role:'.$allRoles);

        Route::get('/evaluations', [EvaluationController::class, 'index'])->middleware('role:'.$allRoles);
        Route::get('/evaluations/{evaluation}', [EvaluationController::class, 'show'])->middleware('role:'.$allRoles);
        Route::post('/evaluations', [EvaluationController::class, 'store'])->middleware('role:'.$staffRoles);
        Route::put('/evaluations/{evaluation}', [EvaluationController::class, 'update'])->middleware('role:'.$staffRoles);
        Route::delete('/evaluations/{evaluation}', [EvaluationController::class, 'destroy'])->middleware('role:'.$staffRoles);
        Route::get('/evaluations/{evaluation}/notes', [EvaluationController::class, 'getNotes'])->middleware('role:'.$staffRoles);
        Route::post('/evaluations/{evaluation}/notes', [EvaluationController::class, 'saveNotes'])->middleware('role:'.$staffRoles);

        Route::get('/grades', [GradeController::class, 'index'])->middleware('role:'.$rbacAdminTrainerRoles);
        Route::post('/grades', [GradeController::class, 'store'])->middleware('role:'.$rbacAdminTrainerRoles);
    });
});

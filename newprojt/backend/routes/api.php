<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\EleveController;
use App\Http\Controllers\Api\EnseignantController;
use App\Http\Controllers\Api\NiveauController;
use App\Http\Controllers\Api\ClasseController;
use App\Http\Controllers\Api\PaiementController;
use App\Http\Controllers\Api\AbsenceController;
use App\Http\Controllers\Api\NoteController;
use App\Http\Controllers\Api\EmploiDuTempsController;
use App\Http\Controllers\Api\TransportController;

Route::prefix('v1')->group(function () {
    // Public routes
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']); // If needed, although not explicitly requested for logic

    // Protected routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);

        // Dashboard
        Route::prefix('dashboard')->group(function () {
            Route::get('/stats', [DashboardController::class, 'getStats']);
            Route::get('/presence-trend', [DashboardController::class, 'getPresenceTrend']);
            Route::get('/eleves-par-niveau', [DashboardController::class, 'getElevesParNiveau']);
            Route::get('/alertes-recentes', [DashboardController::class, 'getAlertesRecentes']);
        });

        // CRUDs
        Route::apiResource('eleves', EleveController::class);
        Route::apiResource('enseignants', EnseignantController::class);
        Route::apiResource('niveaux', NiveauController::class);
        Route::apiResource('classes', ClasseController::class);

        // Paiements
        Route::prefix('paiements')->group(function () {
            Route::get('/impayes', [PaiementController::class, 'getImpayes']);
            Route::get('/{id}/recu', [PaiementController::class, 'getRecu']);
        });
        Route::apiResource('paiements', PaiementController::class)->except(['index']);
        Route::get('/paiements', [PaiementController::class, 'index']); // For custom filtering

        // Absences
        Route::prefix('absences')->group(function () {
            Route::get('/stats', [AbsenceController::class, 'getStats']);
            Route::get('/rapport', [AbsenceController::class, 'getRapport']);
            Route::put('/{id}/justifier', [AbsenceController::class, 'justifier']);
        });
        Route::apiResource('absences', AbsenceController::class);

        // Notes
        Route::prefix('notes')->group(function () {
            Route::post('/bulk', [NoteController::class, 'bulkStore']);
            Route::get('/bulletin/{eleve_id}/{trimestre}', [NoteController::class, 'getBulletin']);
        });
        Route::apiResource('notes', NoteController::class);

        // Emploi du Temps
        Route::apiResource('emploi-du-temps', EmploiDuTempsController::class);

        // Transport
        Route::apiResource('bus', TransportController::class)->only(['index', 'show', 'store', 'update']);
        Route::prefix('transport')->group(function () {
            Route::get('/eleves', [TransportController::class, 'getTransportedEleves']);
            Route::get('/incidents', [TransportController::class, 'getIncidents']);
            Route::post('/incidents', [TransportController::class, 'storeIncident']);
        });
    });
});

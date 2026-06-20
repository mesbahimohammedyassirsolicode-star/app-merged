<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AnalyticsController;

// Analytics routes
Route::middleware(['auth:sanctum', 'role'])->group(function () {
    Route::get('/analytics', [AnalyticsController::class, 'index']);
    Route::post('/analytics/filter', [AnalyticsController::class, 'filter']);
});
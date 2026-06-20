<?php

use App\Http\Controllers\Api\Analytics\AnalyticsCatalogController;
use App\Http\Controllers\Api\Analytics\AnalyticsCopilotController;
use App\Http\Controllers\Api\Analytics\AnalyticsQueryController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/analytics')->middleware(['auth:sanctum', 'throttle:60,1'])->group(function () use ($allRoles, $aiAssistantRoles) {
    Route::get('/catalog', [AnalyticsCatalogController::class, 'index'])->middleware('role:'.$allRoles);
    Route::post('/query', AnalyticsQueryController::class)->middleware('role:'.$allRoles);
    Route::post('/copilot/query', [AnalyticsCopilotController::class, 'query'])->middleware('role:'.$aiAssistantRoles);
});

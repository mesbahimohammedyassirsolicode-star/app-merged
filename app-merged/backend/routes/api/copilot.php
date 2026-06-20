<?php

use App\Http\Controllers\CopilotController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/copilot')->middleware(['auth:sanctum', 'throttle:60,1'])->group(function () use ($aiAssistantRoles) {
    Route::post('/query', [CopilotController::class, 'query'])->middleware('role:'.$aiAssistantRoles);
    Route::get('/sessions', [CopilotController::class, 'sessions'])->middleware('role:'.$aiAssistantRoles);
    Route::get('/sessions/{id}/messages', [CopilotController::class, 'messages'])->middleware('role:'.$aiAssistantRoles);
    Route::delete('/sessions/{id}', [CopilotController::class, 'deleteSession'])->middleware('role:'.$aiAssistantRoles);
    Route::get('/insights', [CopilotController::class, 'insights'])->middleware('role:'.$aiAssistantRoles);
});

<?php

namespace App\Http\Controllers;

use App\Http\Requests\DashboardAnalyticsRequest;
use App\Services\AnalyticsService;

class AnalyticsController extends Controller
{
    public function __construct(
        private AnalyticsService $analyticsService
    ) {}

    public function overview(DashboardAnalyticsRequest $request)
    {
        $payload = $this->analyticsService->getOverview($request->user(), $request->validated());

        return $this->success($payload);
    }
}

<?php

namespace App\Http\Controllers\Api\Analytics;

use App\Analytics\AnalyticsOrchestrator;
use App\Http\Controllers\Controller;
use App\Http\Requests\AnalyticsCopilotQueryRequest;

class AnalyticsCopilotController extends Controller
{
    public function __construct(
        private AnalyticsOrchestrator $orchestrator
    ) {}

    public function query(AnalyticsCopilotQueryRequest $request)
    {
        $result = $this->orchestrator->handle(
            $request->user(),
            (string) $request->validated('query'),
            $request->validated('conversation_id')
        );

        return $this->success($result);
    }
}

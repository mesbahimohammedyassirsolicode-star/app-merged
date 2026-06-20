<?php

namespace App\Http\Controllers\Api\Analytics;

use App\Analytics\Query\AnalyticsStructuredQueryService;
use App\Analytics\Security\AnalyticsScopeResolver;
use App\Http\Controllers\Controller;
use App\Http\Requests\AnalyticsStructuredQueryRequest;

class AnalyticsQueryController extends Controller
{
    public function __construct(
        private AnalyticsStructuredQueryService $structuredQueryService,
        private AnalyticsScopeResolver $scopeResolver
    ) {}

    public function __invoke(AnalyticsStructuredQueryRequest $request)
    {
        $scope = $this->scopeResolver->resolve($request->user());
        $payload = $this->structuredQueryService->execute($scope, $request->validated());

        return $this->success($payload);
    }
}

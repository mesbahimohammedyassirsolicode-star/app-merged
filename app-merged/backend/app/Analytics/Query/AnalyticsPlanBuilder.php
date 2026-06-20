<?php

namespace App\Analytics\Query;

use App\Analytics\DTOs\AnalyticsIntentData;
use App\Analytics\DTOs\AnalyticsPlanData;

class AnalyticsPlanBuilder
{
    public function build(AnalyticsIntentData $intent, array $scope): AnalyticsPlanData
    {
        $defaultTtl = (int) config('analytics.copilot.default_cache_ttl', 300);
        $chartType = $intent->visualizationHint ?? 'bar';

        $engines = match ($intent->family) {
            'risk_analysis' => ['metrics', 'risk', 'insight', 'recommendation'],
            'trend_analysis' => ['metrics', 'trend', 'insight'],
            'comparison_analysis' => ['metrics', 'insight'],
            'prediction_analysis' => ['metrics', 'prediction', 'insight'],
            'anomaly_analysis' => ['metrics', 'anomaly', 'insight'],
            default => ['metrics', 'insight'],
        };

        return new AnalyticsPlanData(
            intentFamily: $intent->family,
            intentName: $intent->name,
            metrics: $intent->metrics,
            dimensions: $intent->dimensions,
            filters: $intent->filters,
            scope: $scope,
            engines: $engines,
            chartType: $chartType,
            cacheTtl: $defaultTtl,
        );
    }
}

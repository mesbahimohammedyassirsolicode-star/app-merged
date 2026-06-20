<?php

namespace App\Analytics\DTOs;

class AnalyticsPlanData
{
    public function __construct(
        public readonly string $intentFamily,
        public readonly string $intentName,
        public readonly array $metrics,
        public readonly array $dimensions,
        public readonly array $filters,
        public readonly array $scope,
        public readonly array $engines,
        public readonly string $chartType,
        public readonly int $cacheTtl,
    ) {}

    public function toArray(): array
    {
        return [
            'intent_family' => $this->intentFamily,
            'intent_name' => $this->intentName,
            'metrics' => $this->metrics,
            'dimensions' => $this->dimensions,
            'filters' => $this->filters,
            'scope' => $this->scope,
            'engines' => $this->engines,
            'chart_type' => $this->chartType,
            'cache_ttl' => $this->cacheTtl,
        ];
    }
}

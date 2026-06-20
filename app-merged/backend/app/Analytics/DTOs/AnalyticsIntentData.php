<?php

namespace App\Analytics\DTOs;

class AnalyticsIntentData
{
    public function __construct(
        public readonly string $family,
        public readonly string $name,
        public readonly float $confidence,
        public readonly array $filters = [],
        public readonly array $entities = [],
        public readonly array $dimensions = [],
        public readonly array $metrics = [],
        public readonly ?string $visualizationHint = null,
        public readonly bool $followUp = false,
        public readonly string $source = 'rule',
    ) {}

    public function toArray(): array
    {
        return [
            'family' => $this->family,
            'name' => $this->name,
            'confidence' => $this->confidence,
            'filters' => $this->filters,
            'entities' => $this->entities,
            'dimensions' => $this->dimensions,
            'metrics' => $this->metrics,
            'visualization_hint' => $this->visualizationHint,
            'follow_up' => $this->followUp,
            'source' => $this->source,
        ];
    }
}

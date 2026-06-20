<?php

namespace App\Services;

use App\Analytics\AnalyticsOrchestrator;
use App\Models\User;

class AiAssistantService
{
    public function __construct(
        private AnalyticsOrchestrator $analyticsOrchestrator
    ) {}

    public function handle(User $user, string $query): array
    {
        $response = $this->analyticsOrchestrator->handle($user, $query);

        return [
            'intent' => (string) data_get($response, 'intent.name', 'average_performance'),
            'data' => $response['data'] ?? [],
            'chart' => $response['charts'][0] ?? null,
            'summary' => (string) ($response['summary'] ?? ''),
            'insights' => collect($response['insights'] ?? [])->map(fn ($item) => is_array($item) ? (string) ($item['detail'] ?? $item['title'] ?? '') : (string) $item)->filter()->values()->all(),
            'recommendations' => collect($response['recommendations'] ?? [])->map(fn ($item) => is_array($item) ? (string) ($item['label'] ?? '') : (string) $item)->filter()->values()->all(),
            'meta' => [
                'intent_source' => data_get($response, 'intent.source', 'rule'),
                'applied_filters' => data_get($response, 'meta.plan.filters', []),
                'conversation_id' => $response['conversation_id'] ?? null,
                'trace_id' => data_get($response, 'meta.trace_id'),
            ],
        ];
    }
}

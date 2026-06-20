<?php

namespace App\Services\Copilot\Agents;

use App\Services\Copilot\AgentInterface;
use App\Services\GeminiService;

class ReportingAgent implements AgentInterface
{
    public function __construct(private GeminiService $gemini) {}

    public function name(): string { return 'reporting'; }

    public function supportedIntents(): array
    {
        return ['report_generation'];
    }

    public function handle(string $query, array $context): array
    {
        $type = $this->detectType($query);
        $data = $context['previous_agent_data'] ?? [];

        $gemini = $this->gemini->query(
            "Génère un rapport {$type} structuré en français.\nDemande: {$query}",
            $data,
            $context['history'] ?? []
        );

        return [
            'summary' => $gemini['summary'] ?? "Rapport {$type} généré.",
            'insights' => $gemini['insights'] ?? [],
            'recommendations' => $gemini['recommendations'] ?? [],
            'risk_alerts' => [],
            'chart' => $gemini['chart'] ?? null,
            'report_type' => $type,
            'agent' => $this->name(),
            'source' => $gemini ? 'gemini' : 'deterministic',
        ];
    }

    private function detectType(string $q): string
    {
        $t = mb_strtolower($q);
        if (str_contains($t, 'présence') || str_contains($t, 'assiduité')) return 'présence';
        if (str_contains($t, 'performance') || str_contains($t, 'note')) return 'performance';
        if (str_contains($t, 'exécutif') || str_contains($t, 'global')) return 'exécutif';
        return 'pédagogique';
    }
}

<?php

namespace App\Services\Copilot\Agents;

use App\Services\Copilot\AgentInterface;
use App\Services\GeminiService;

/**
 * RecommendationAgent — Generates pedagogical and administrative recommendations.
 */
class RecommendationAgent implements AgentInterface
{
    public function __construct(private GeminiService $gemini) {}

    public function name(): string { return 'recommendation'; }

    public function supportedIntents(): array
    {
        return ['recommendation'];
    }

    public function handle(string $query, array $context): array
    {
        // Collect data from other agents' previous outputs if available
        $previousData = $context['previous_agent_data'] ?? [];

        $geminiResponse = $this->gemini->query(
            "En te basant sur les données suivantes, génère des recommandations pédagogiques et administratives détaillées.\n\nQuestion: {$query}",
            $previousData,
            $context['history'] ?? []
        );

        if ($geminiResponse) {
            return [
                'summary' => $geminiResponse['summary'] ?? 'Recommandations générées par le copilot.',
                'insights' => $geminiResponse['insights'] ?? [],
                'recommendations' => $geminiResponse['recommendations'] ?? [],
                'risk_alerts' => $geminiResponse['risk_alerts'] ?? [],
                'chart' => null,
                'agent' => $this->name(),
                'source' => 'gemini',
            ];
        }

        return [
            'summary' => 'Voici les recommandations basées sur l\'analyse des données disponibles.',
            'insights' => [],
            'recommendations' => [
                ['label' => 'Organiser des séances de rattrapage pour les modules en difficulté.', 'priority' => 'high', 'type' => 'pedagogical'],
                ['label' => 'Renforcer le suivi pédagogique des étudiants à risque.', 'priority' => 'high', 'type' => 'pedagogical'],
                ['label' => 'Mettre en place un système de tutorat entre pairs.', 'priority' => 'medium', 'type' => 'pedagogical'],
                ['label' => 'Convoquer les parents des étudiants fréquemment absents.', 'priority' => 'high', 'type' => 'administrative'],
                ['label' => 'Proposer un accompagnement psychopédagogique.', 'priority' => 'medium', 'type' => 'administrative'],
            ],
            'risk_alerts' => [],
            'chart' => null,
            'agent' => $this->name(),
            'source' => 'deterministic',
        ];
    }
}

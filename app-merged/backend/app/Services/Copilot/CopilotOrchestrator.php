<?php

namespace App\Services\Copilot;

use App\Analytics\Security\AnalyticsScopeResolver;
use App\Models\AnalyticsConversation;
use App\Models\AnalyticsMessage;
use App\Models\User;
use App\Services\GeminiService;
use App\Services\Copilot\Agents\AcademicAgent;
use App\Services\Copilot\Agents\AnalyticsAgent;
use App\Services\Copilot\Agents\AttendanceAgent;
use App\Services\Copilot\Agents\RecommendationAgent;
use App\Services\Copilot\Agents\ReportingAgent;
use App\Services\Copilot\Agents\RiskDetectionAgent;
use Illuminate\Support\Str;

/**
 * CopilotOrchestrator — Routes queries to the right agent,
 * manages conversation memory, and returns structured responses.
 */
class CopilotOrchestrator
{
    /** @var AgentInterface[] */
    private array $agents = [];

    public function __construct(
        private GeminiService $gemini,
        private AnalyticsScopeResolver $scopeResolver,
    ) {
        $this->agents = [
            new AcademicAgent($gemini),
            new AttendanceAgent($gemini),
            new RiskDetectionAgent($gemini),
            new RecommendationAgent($gemini),
            new ReportingAgent($gemini),
            new AnalyticsAgent($gemini),
        ];
    }

    public function handle(User $user, string $query, ?int $sessionId = null): array
    {
        $this->validateQuery($query);
        $scope = $this->scopeResolver->resolve($user);
        $session = $this->resolveSession($user, $sessionId);
        $history = $this->getConversationHistory($session);
        $intent = $this->detectIntent($query);
        $agent = $this->routeToAgent($intent);

        $context = [
            'scope' => $scope,
            'filters' => [],
            'history' => $history,
            'user_role' => $user->role,
            'previous_agent_data' => $this->getPreviousData($session),
        ];

        $result = $agent->handle($query, $context);

        // Save user message
        $this->saveMessage($session, 'user', $query);

        // Save assistant response
        $this->saveMessage($session, 'assistant', $result['summary'] ?? '', [
            'intent' => $intent,
            'agent' => $result['agent'] ?? $agent->name(),
            'insights' => $result['insights'] ?? [],
            'recommendations' => $result['recommendations'] ?? [],
            'risk_alerts' => $result['risk_alerts'] ?? [],
            'chart' => $result['chart'] ?? null,
            'source' => $result['source'] ?? 'deterministic',
        ]);

        // Update session title from first message
        if ($session->title === 'Nouvelle conversation') {
            $session->update(['title' => Str::limit($query, 80)]);
        }

        return [
            'session_id' => (int) $session->id,
            'intent' => $intent,
            'agent' => $result['agent'] ?? $agent->name(),
            'summary' => (string) ($result['summary'] ?? ''),
            'insights' => $result['insights'] ?? [],
            'recommendations' => $result['recommendations'] ?? [],
            'risk_alerts' => $result['risk_alerts'] ?? [],
            'chart' => $result['chart'] ?? null,
            'data' => $result['data'] ?? [],
            'source' => $result['source'] ?? 'deterministic',
            'follow_up_suggestions' => $this->getSuggestions($intent),
        ];
    }

    public function getSessions(User $user, int $limit = 20): array
    {
        return AnalyticsConversation::where('user_id', $user->id)
            ->orderByDesc('updated_at')
            ->limit($limit)
            ->get()
            ->map(fn ($s) => [
                'id' => (int) $s->id,
                'title' => (string) $s->title,
                'created_at' => $s->created_at->toIso8601String(),
                'updated_at' => $s->updated_at->toIso8601String(),
            ])
            ->all();
    }

    public function getSessionMessages(User $user, int $sessionId): array
    {
        $session = AnalyticsConversation::where('id', $sessionId)
            ->where('user_id', $user->id)
            ->firstOrFail();

        return $session->messages()
            ->orderBy('created_at')
            ->get()
            ->map(fn ($m) => [
                'id' => (int) $m->id,
                'role' => (string) $m->role,
                'content' => (string) $m->message,
                'payload' => $m->payload,
                'created_at' => $m->created_at->toIso8601String(),
            ])
            ->all();
    }

    public function deleteSession(User $user, int $sessionId): void
    {
        $session = AnalyticsConversation::where('id', $sessionId)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $session->messages()->delete();
        $session->delete();
    }

    public function getInsightsSummary(User $user): array
    {
        $scope = $this->scopeResolver->resolve($user);
        $riskAgent = new RiskDetectionAgent($this->gemini);
        $result = $riskAgent->handle('Détecte tous les risques', [
            'scope' => $scope,
            'filters' => [],
            'history' => [],
        ]);

        return [
            'risk_alerts' => $result['risk_alerts'] ?? [],
            'at_risk_count' => $result['total_at_risk'] ?? 0,
            'risk_summary' => $result['risk_summary'] ?? [],
            'insights' => $result['insights'] ?? [],
        ];
    }

    private function detectIntent(string $query): string
    {
        $text = mb_strtolower(trim($query));

        $map = [
            'academic_analysis' => ['moyenne', 'note', 'grade', 'performance', 'module', 'filière', 'tgi', 'tdi', 'résultat', 'bulletin', 'meilleur', 'faible'],
            'attendance_analysis' => ['absent', 'présence', 'assiduité', 'attendance', 'retard', 'ponctualité'],
            'risk_detection' => ['risque', 'risk', 'danger', 'échec', 'abandon', 'dropout', 'alerte'],
            'recommendation' => ['recommand', 'conseil', 'suggestion', 'action', 'améliorer', 'rattrapage', 'tutorat'],
            'report_generation' => ['rapport', 'report', 'bilan', 'synthèse', 'résumé', 'pdf'],
            'group_comparison' => ['compar', 'versus', 'vs', 'différence entre'],
            'trend_analysis' => ['tendance', 'trend', 'évolution', 'progression', 'historique'],
        ];

        foreach ($map as $intent => $keywords) {
            foreach ($keywords as $kw) {
                if (str_contains($text, $kw)) return $intent;
            }
        }

        // Try Gemini intent detection
        $geminiIntent = $this->gemini->detectIntent($query);
        if ($geminiIntent && isset($geminiIntent['intent'])) {
            return (string) $geminiIntent['intent'];
        }

        return 'general_question';
    }

    private function routeToAgent(string $intent): AgentInterface
    {
        foreach ($this->agents as $agent) {
            if (in_array($intent, $agent->supportedIntents(), true)) {
                return $agent;
            }
        }
        // Default to analytics agent
        return $this->agents[array_key_last($this->agents)];
    }

    private function resolveSession(User $user, ?int $sessionId): AnalyticsConversation
    {
        if ($sessionId) {
            $session = AnalyticsConversation::where('id', $sessionId)
                ->where('user_id', $user->id)
                ->first();
            if ($session) {
                $session->touch();
                return $session;
            }
        }

        return AnalyticsConversation::create([
            'user_id' => $user->id,
            'title' => 'Nouvelle conversation',
            'scope_hash' => md5($user->id . '|' . $user->role),
        ]);
    }

    private function getConversationHistory(AnalyticsConversation $session): array
    {
        return $session->messages()
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->reverse()
            ->map(fn ($m) => [
                'role' => $m->role,
                'content' => $m->message,
            ])
            ->values()
            ->all();
    }

    private function getPreviousData(AnalyticsConversation $session): array
    {
        $last = $session->messages()
            ->where('role', 'assistant')
            ->orderByDesc('created_at')
            ->first();

        return $last && is_array($last->payload) ? $last->payload : [];
    }

    private function saveMessage(AnalyticsConversation $session, string $role, string $content, array $payload = []): AnalyticsMessage
    {
        return AnalyticsMessage::create([
            'conversation_id' => $session->id,
            'role' => $role,
            'message' => $content,
            'payload' => ! empty($payload) ? $payload : null,
        ]);
    }

    private function getSuggestions(string $intent): array
    {
        return match ($intent) {
            'academic_analysis' => [
                'Quels modules ont les notes les plus faibles ?',
                'Compare les groupes de cette filière.',
                'Quels étudiants ont les meilleures notes ?',
            ],
            'attendance_analysis' => [
                'Quels étudiants sont souvent absents ?',
                'Quelle est la tendance de présence ce mois ?',
                'Compare la présence entre les groupes.',
            ],
            'risk_detection' => [
                'Quelles sont les recommandations ?',
                'Génère un rapport de risques.',
                'Quels modules contribuent le plus aux risques ?',
            ],
            default => [
                'Analyse la performance académique.',
                'Montre les étudiants à risque.',
                'Génère un rapport pédagogique.',
            ],
        };
    }

    private function validateQuery(string $query): void
    {
        if (preg_match('/(\\b(select|drop|delete|insert|update|union|truncate)\\b|;|--|\\*\\/|\\/\\*)/i', $query)) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'query' => ['Requête non supportée. Utilisez une question en langage naturel.'],
            ]);
        }
    }
}

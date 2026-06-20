<?php

namespace App\Analytics;

use App\Analytics\Conversation\AnalyticsConversationService;
use App\Analytics\Intent\AnalyticsIntentClassifier;
use App\Analytics\Query\AnalyticsPlanBuilder;
use App\Analytics\Security\AnalyticsScopeResolver;
use App\Analytics\Visualization\AnalyticsChartService;
use App\Models\AuditLog;
use App\Models\User;
use App\Services\AnalyticsService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AnalyticsOrchestrator
{
    public function __construct(
        private AnalyticsScopeResolver $scopeResolver,
        private AnalyticsConversationService $conversationService,
        private AnalyticsIntentClassifier $intentClassifier,
        private AnalyticsPlanBuilder $planBuilder,
        private AnalyticsService $analyticsService,
        private AnalyticsChartService $chartService,
    ) {}

    public function handle(User $user, string $query, ?string $conversationId = null): array
    {
        $this->validateQuerySafety($query);

        $scope = $this->scopeResolver->resolve($user);
        $conversation = $this->conversationService->startOrContinue($user, $conversationId);
        $memory = $this->conversationService->recentContext($conversation);
        $intent = $this->intentClassifier->classify($query, $memory);
        $plan = $this->planBuilder->build($intent, $scope);
        $traceId = (string) Str::uuid();

        $cacheKey = 'analytics:copilot:'.md5($user->id.'|'.json_encode($plan->toArray()).'|'.mb_strtolower(trim($query)));
        $cacheHit = Cache::has($cacheKey);

        $this->conversationService->appendUserMessage($conversation, $query, [
            'query' => $query,
            'intent_name' => $intent->name,
            'dimensions' => $intent->dimensions,
            'filters' => $intent->filters,
        ]);

        $payload = Cache::remember($cacheKey, $plan->cacheTtl, function () use ($user, $intent, $plan) {
            return $this->executePlan($user, $intent->toArray(), $plan->toArray());
        });

        $response = [
            'conversation_id' => (string) $conversation->id,
            'intent' => [
                'family' => $intent->family,
                'name' => $intent->name,
                'confidence' => $intent->confidence,
                'source' => $intent->source,
            ],
            'scope' => [
                'type' => $scope['scope_type'],
                'masked' => (bool) $scope['masked'],
            ],
            ...$payload,
            'meta' => [
                'trace_id' => $traceId,
                'cache_hit' => $cacheHit,
                'generated_at' => now()->toIso8601String(),
                'plan' => $plan->toArray(),
            ],
        ];

        $assistantMessage = $this->conversationService->appendAssistantMessage($conversation, $response, [
            'query' => $query,
            'intent_name' => $intent->name,
            'dimensions' => $intent->dimensions,
            'filters' => $intent->filters,
            'last_summary' => $response['summary'] ?? null,
        ]);

        $response['message_id'] = (string) $assistantMessage->id;

        AuditLog::log('analytics.copilot.query', 'AnalyticsConversation', (int) $conversation->id, null, [
            'intent' => $intent->toArray(),
            'scope_type' => $scope['scope_type'],
            'trace_id' => $traceId,
        ]);

        return $response;
    }

    private function executePlan(User $user, array $intent, array $plan): array
    {
        $overview = $this->analyticsService->getOverview($user, $plan['filters']);

        $payload = match ($intent['name']) {
            'students_at_risk' => $this->studentsAtRisk($overview),
            'top_students' => $this->topStudents($user, $plan),
            'attendance_report' => $this->attendanceReport($overview),
            'grades_by_module' => $this->gradesByModule($user, $plan),
            default => $this->averagePerformance($overview),
        };

        return $payload + [
            'follow_up_suggestions' => $this->followUpSuggestions($intent['name']),
        ];
    }

    private function studentsAtRisk(array $overview): array
    {
        $data = $overview['ai']['at_risk_students'] ?? [];

        return [
            'summary' => count($data) > 0
                ? count($data).' at-risk students were identified in your current scope.'
                : 'No at-risk students were detected in your current scope.',
            'insights' => [
                ['title' => 'Risk scoring', 'detail' => 'Risk combines attendance consistency with grade performance and recent decline.'],
                ['title' => 'Scope enforcement', 'detail' => 'Student results are restricted to your authorized role scope.'],
            ],
            'recommendations' => array_map(fn ($item) => ['type' => 'intervention', 'label' => $item], $overview['ai']['recommendations'] ?? []),
            'charts' => [$this->chartService->build('bar', array_slice($data, 0, 10), 'student_name', 'risk_score')],
            'data' => $data,
        ];
    }

    private function averagePerformance(array $overview): array
    {
        $kpis = $overview['kpis'];

        return [
            'summary' => 'Average performance in the selected scope is '.$kpis['average_grade'].'/20 with attendance at '.$kpis['attendance_rate'].'%.',
            'insights' => [
                ['title' => 'Attendance health', 'detail' => 'Attendance is currently '.$kpis['attendance_rate'].'% across the scoped population.'],
                ['title' => 'Academic performance', 'detail' => 'Average grade is '.$kpis['average_grade'].'/20 in the selected period.'],
            ],
            'recommendations' => [
                ['type' => 'monitoring', 'label' => $kpis['attendance_rate'] < 80 ? 'Launch attendance recovery actions for low-participation cohorts.' : 'Maintain current attendance discipline across active cohorts.'],
                ['type' => 'academic', 'label' => $kpis['average_grade'] < 10 ? 'Schedule remedial support on weak modules before the next evaluation.' : 'Create stretch practice for high-performing cohorts.'],
            ],
            'charts' => [$this->chartService->build('bar', [
                ['label' => 'Attendance Rate', 'value' => (float) $kpis['attendance_rate']],
                ['label' => 'Average Grade', 'value' => (float) $kpis['average_grade']],
            ])],
            'data' => $kpis,
        ];
    }

    private function attendanceReport(array $overview): array
    {
        $timeline = $overview['charts']['attendance_trends'] ?? [];

        return [
            'summary' => 'Attendance trend generated for '.count($timeline).' periods in your current scope.',
            'insights' => [
                ['title' => 'Trend visibility', 'detail' => 'Period-level attendance and absence counts reveal stability, decline, and recovery patterns.'],
                ['title' => 'Operational action', 'detail' => 'Use recent drops to trigger outreach before academic performance declines.'],
            ],
            'recommendations' => [
                ['type' => 'attendance', 'label' => 'Contact learners with repeated absence patterns early.'],
                ['type' => 'attendance', 'label' => 'Review timetable friction for groups with synchronized drops.'],
            ],
            'charts' => [$this->chartService->build('line', $timeline, 'period', 'attendance_rate')],
            'data' => $timeline,
        ];
    }

    private function topStudents(User $user, array $plan): array
    {
        $rows = $this->analyticsService->topStudentsDataset($user, $plan['filters']);

        return [
            'summary' => count($rows).' top-performing students were identified in your scoped data.',
            'insights' => [
                ['title' => 'Ranking logic', 'detail' => 'Top ranking uses average grade across available evaluations in the current scope.'],
                ['title' => 'Operational use', 'detail' => 'High performers can be used as peer mentors or benchmark examples.'],
            ],
            'recommendations' => [
                ['type' => 'student_support', 'label' => 'Pair strong students with struggling peers in the same group where appropriate.'],
            ],
            'charts' => [$this->chartService->build('bar', $rows, 'student_name', 'avg_grade')],
            'data' => $rows,
        ];
    }

    private function gradesByModule(User $user, array $plan): array
    {
        $rows = $this->analyticsService->gradesByModuleDataset($user, $plan['filters']);

        return [
            'summary' => 'Module performance calculated for '.count($rows).' modules in your current scope.',
            'insights' => [
                ['title' => 'Module spread', 'detail' => 'Module averages reveal where learners perform best and where support is needed most.'],
                ['title' => 'Review focus', 'detail' => 'Low-performing modules should be reviewed for curriculum difficulty, evaluation design, and attendance overlap.'],
            ],
            'recommendations' => [
                ['type' => 'module_support', 'label' => 'Prioritize remediation plans for the lowest-performing modules.'],
            ],
            'charts' => [$this->chartService->build('bar', array_slice($rows, 0, 12), 'module_code', 'avg_grade')],
            'data' => $rows,
        ];
    }

    private function followUpSuggestions(string $intentName): array
    {
        return match ($intentName) {
            'students_at_risk' => [
                'Show the same result as a chart.',
                'Compare high-risk students with last month.',
                'Which module contributes most to current risk?',
            ],
            'attendance_report' => [
                'Compare this attendance trend with last month.',
                'Split the trend by group.',
                'Show the groups with the biggest drop.',
            ],
            default => [
                'Compare this result with last month.',
                'Show the same result by group.',
                'Export this result as PDF.',
            ],
        };
    }

    private function validateQuerySafety(string $query): void
    {
        if (preg_match('/(\b(select|drop|delete|insert|update|union|truncate)\b|;|--|\*\/|\/\*)/i', $query)) {
            throw ValidationException::withMessages([
                'query' => ['Unsupported query pattern detected. Please use a natural-language analytics question.'],
            ]);
        }
    }
}

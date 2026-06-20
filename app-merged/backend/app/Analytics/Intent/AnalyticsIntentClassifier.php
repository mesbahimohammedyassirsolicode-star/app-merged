<?php

namespace App\Analytics\Intent;

use App\Analytics\DTOs\AnalyticsIntentData;
use App\Services\LLMService;
use Carbon\CarbonImmutable;

class AnalyticsIntentClassifier
{
    public function __construct(
        private LLMService $llmService
    ) {}

    public function classify(string $query, array $memory = []): AnalyticsIntentData
    {
        $llm = $this->llmService->extractIntentAndFilters($query);
        if (is_array($llm)) {
            $intent = $this->fromLlmPayload($llm, $query, $memory);
            if ($intent instanceof AnalyticsIntentData) {
                return $intent;
            }
        }

        return $this->fromRules($query, $memory);
    }

    private function fromLlmPayload(array $payload, string $query, array $memory): ?AnalyticsIntentData
    {
        $intentName = is_string($payload['intent'] ?? null) ? trim($payload['intent']) : '';
        if ($intentName === '') {
            return null;
        }

        $familyMap = [
            'students_at_risk' => 'risk_analysis',
            'attendance_report' => 'trend_analysis',
            'grades_by_module' => 'comparison_analysis',
            'average_performance' => 'kpi_lookup',
            'top_students' => 'comparison_analysis',
        ];

        $family = $familyMap[$intentName] ?? 'kpi_lookup';
        $filters = $this->normalizeFilters($payload['filters'] ?? []);
        $followUp = $this->isFollowUpQuery($query);
        $dimensions = $this->inferDimensions($intentName, $query, $memory);
        $metrics = $this->inferMetrics($intentName);

        return new AnalyticsIntentData(
            family: $family,
            name: $intentName,
            confidence: 0.92,
            filters: $filters,
            entities: $this->extractEntities($query),
            dimensions: $dimensions,
            metrics: $metrics,
            visualizationHint: $this->inferVisualizationHint($intentName, $query),
            followUp: $followUp,
            source: 'llm',
        );
    }

    private function fromRules(string $query, array $memory): AnalyticsIntentData
    {
        $text = mb_strtolower(trim($query));
        $intentName = 'average_performance';
        $family = 'kpi_lookup';

        $rules = [
            'students_at_risk' => ['risk_analysis', ['at risk', 'risk', 'fail', 'danger', 'support']],
            'attendance_report' => ['trend_analysis', ['attendance', 'presence', 'absences', 'late', 'trend']],
            'grades_by_module' => ['comparison_analysis', ['module', 'grades by module', 'notes par module']],
            'top_students' => ['comparison_analysis', ['top students', 'best students', 'top performers']],
            'average_performance' => ['kpi_lookup', ['average', 'overall performance', 'moyenne']],
        ];

        foreach ($rules as $candidate => [$candidateFamily, $keywords]) {
            foreach ($keywords as $keyword) {
                if (str_contains($text, $keyword)) {
                    $intentName = $candidate;
                    $family = $candidateFamily;
                    break 2;
                }
            }
        }

        return new AnalyticsIntentData(
            family: $family,
            name: $intentName,
            confidence: 0.72,
            filters: $this->normalizeFilters(['date_range' => $this->inferDateRange($text)]),
            entities: $this->extractEntities($query),
            dimensions: $this->inferDimensions($intentName, $query, $memory),
            metrics: $this->inferMetrics($intentName),
            visualizationHint: $this->inferVisualizationHint($intentName, $query),
            followUp: $this->isFollowUpQuery($query),
            source: 'rule',
        );
    }

    private function normalizeFilters(array $filters): array
    {
        $dateRange = is_string($filters['date_range'] ?? null) ? strtolower($filters['date_range']) : 'none';
        $now = CarbonImmutable::now();

        $dateFilters = match ($dateRange) {
            'this_month' => ['date_from' => $now->startOfMonth()->toDateString(), 'date_to' => $now->endOfMonth()->toDateString()],
            'last_6_months' => ['date_from' => $now->subMonths(5)->startOfMonth()->toDateString(), 'date_to' => $now->endOfMonth()->toDateString()],
            'this_week' => ['date_from' => $now->startOfWeek()->toDateString(), 'date_to' => $now->endOfWeek()->toDateString()],
            'this_year' => ['date_from' => $now->startOfYear()->toDateString(), 'date_to' => $now->endOfYear()->toDateString()],
            default => [],
        };

        return array_filter([
            ...$dateFilters,
            'module' => is_string($filters['module'] ?? null) ? trim((string) $filters['module']) : null,
            'group' => is_string($filters['group'] ?? null) ? trim((string) $filters['group']) : null,
        ], fn ($value) => $value !== null && $value !== '');
    }

    private function inferDateRange(string $text): string
    {
        return match (true) {
            str_contains($text, 'this month'), str_contains($text, 'ce mois') => 'this_month',
            str_contains($text, 'last 6 months'), str_contains($text, '6 months') => 'last_6_months',
            str_contains($text, 'this week'), str_contains($text, 'cette semaine') => 'this_week',
            str_contains($text, 'this year'), str_contains($text, 'cette annee'), str_contains($text, 'cette année') => 'this_year',
            default => 'none',
        };
    }

    private function inferMetrics(string $intentName): array
    {
        return match ($intentName) {
            'students_at_risk' => ['risk_score'],
            'attendance_report' => ['attendance_rate'],
            'grades_by_module' => ['average_grade'],
            'top_students' => ['average_grade'],
            default => ['attendance_rate', 'average_grade'],
        };
    }

    private function inferDimensions(string $intentName, string $query, array $memory): array
    {
        $text = mb_strtolower($query);
        $dimensions = [];

        if (str_contains($text, 'module')) {
            $dimensions[] = 'module';
        }
        if (str_contains($text, 'group')) {
            $dimensions[] = 'group';
        }
        if (str_contains($text, 'student')) {
            $dimensions[] = 'student';
        }
        if (str_contains($text, 'week')) {
            $dimensions[] = 'week';
        }
        if (str_contains($text, 'month') || in_array($intentName, ['attendance_report', 'average_performance'], true)) {
            $dimensions[] = 'month';
        }

        if ($dimensions === [] && isset($memory['dimensions']) && is_array($memory['dimensions'])) {
            $dimensions = $memory['dimensions'];
        }

        return array_values(array_unique($dimensions));
    }

    private function inferVisualizationHint(string $intentName, string $query): string
    {
        $text = mb_strtolower($query);
        if (str_contains($text, 'heatmap')) {
            return 'heatmap';
        }
        if (str_contains($text, 'scatter')) {
            return 'scatter';
        }

        return match ($intentName) {
            'attendance_report' => 'line',
            'students_at_risk', 'top_students', 'grades_by_module' => 'bar',
            default => 'bar',
        };
    }

    private function extractEntities(string $query): array
    {
        return [
            'raw_query' => $query,
        ];
    }

    private function isFollowUpQuery(string $query): bool
    {
        $text = mb_strtolower(trim($query));

        foreach (['now', 'compare', 'same', 'that', 'those', 'them', 'split', 'only'] as $token) {
            if (str_starts_with($text, $token) || str_contains($text, ' '.$token.' ')) {
                return true;
            }
        }

        return false;
    }
}

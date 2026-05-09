<?php

namespace App\Services;

use Carbon\CarbonImmutable;

class IntentParserService
{
    public function __construct(
        private LLMService $llmService
    ) {}

    /**
     * Parse user query into intent + normalized filters.
     */
    public function parse(string $query): array
    {
        $llmPayload = $this->llmService->extractIntentAndFilters($query);
        if (is_array($llmPayload)) {
            $normalized = $this->normalizeParsedPayload($llmPayload);
            if ($normalized !== null) {
                return $normalized + ['source' => 'llm'];
            }
        }

        return $this->fallbackParse($query) + ['source' => 'rule'];
    }

    /**
     * Parse user query to supported assistant intent.
     */
    public function detectIntent(string $query): string
    {
        $text = mb_strtolower(trim($query));

        $rules = [
            'students_at_risk' => [
                'at risk', 'risk', 'who will fail', 'fail', 'danger', 'absent a lot',
                'risky students', 'etudiants a risque', 'students in danger',
            ],
            'average_performance' => [
                'average', 'moyenne', 'overall performance', 'performance this month', 'global performance',
            ],
            'top_students' => [
                'top students', 'best students', 'top performers', 'best performer', 'meilleurs etudiants',
            ],
            'attendance_report' => [
                'attendance', 'presence', 'absences', 'attendance report', 'attendance trend',
            ],
            'grades_by_module' => [
                'grades by module', 'module grades', 'notes par module', 'module performance',
            ],
        ];

        foreach ($rules as $intent => $keywords) {
            foreach ($keywords as $keyword) {
                if (str_contains($text, $keyword)) {
                    return $intent;
                }
            }
        }

        return 'average_performance';
    }

    private function fallbackParse(string $query): array
    {
        $intent = $this->detectIntent($query);
        $text = mb_strtolower(trim($query));
        $dateRange = 'none';

        if (str_contains($text, 'this month') || str_contains($text, 'ce mois')) {
            $dateRange = 'this_month';
        } elseif (str_contains($text, 'last 6 months') || str_contains($text, '6 months')) {
            $dateRange = 'last_6_months';
        } elseif (str_contains($text, 'this week') || str_contains($text, 'cette semaine')) {
            $dateRange = 'this_week';
        } elseif (str_contains($text, 'this year') || str_contains($text, 'cette annee') || str_contains($text, 'cette année')) {
            $dateRange = 'this_year';
        }

        return [
            'intent' => $intent,
            'filters' => $this->dateRangeToFilters($dateRange),
        ];
    }

    private function normalizeParsedPayload(array $payload): ?array
    {
        $allowedIntents = [
            'students_at_risk',
            'average_performance',
            'top_students',
            'attendance_report',
            'grades_by_module',
        ];

        $intent = isset($payload['intent']) && is_string($payload['intent'])
            ? trim($payload['intent'])
            : '';

        if (! in_array($intent, $allowedIntents, true)) {
            return null;
        }

        $filters = isset($payload['filters']) && is_array($payload['filters']) ? $payload['filters'] : [];
        $dateRange = isset($filters['date_range']) && is_string($filters['date_range'])
            ? strtolower(trim($filters['date_range']))
            : 'none';

        return [
            'intent' => $intent,
            'filters' => $this->dateRangeToFilters($dateRange),
        ];
    }

    private function dateRangeToFilters(string $dateRange): array
    {
        $now = CarbonImmutable::now();

        return match ($dateRange) {
            'this_month' => [
                'date_from' => $now->startOfMonth()->toDateString(),
                'date_to' => $now->endOfMonth()->toDateString(),
            ],
            'last_6_months' => [
                'date_from' => $now->subMonths(5)->startOfMonth()->toDateString(),
                'date_to' => $now->endOfMonth()->toDateString(),
            ],
            'this_week' => [
                'date_from' => $now->startOfWeek()->toDateString(),
                'date_to' => $now->endOfWeek()->toDateString(),
            ],
            'this_year' => [
                'date_from' => $now->startOfYear()->toDateString(),
                'date_to' => $now->endOfYear()->toDateString(),
            ],
            default => [],
        };
    }
}

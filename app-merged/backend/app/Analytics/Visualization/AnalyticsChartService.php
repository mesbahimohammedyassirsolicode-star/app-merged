<?php

namespace App\Analytics\Visualization;

class AnalyticsChartService
{
    public function build(string $type, array $rows, ?string $labelKey = null, ?string $valueKey = null): array
    {
        if ($rows === []) {
            return [
                'type' => $type,
                'labels' => [],
                'data' => [],
                'series' => [],
            ];
        }

        $first = $rows[0];
        $labelKey ??= $this->firstMatchingKey($first, ['period', 'module_code', 'module_label', 'student_name', 'label', 'group_name']);
        $valueKey ??= $this->firstMatchingKey($first, ['attendance_rate', 'avg_grade', 'risk_score', 'value', 'count']);

        return [
            'type' => $type,
            'labels' => array_values(array_map(fn ($row) => (string) ($row[$labelKey] ?? ''), $rows)),
            'data' => array_values(array_map(fn ($row) => (float) ($row[$valueKey] ?? 0), $rows)),
            'series' => [
                [
                    'key' => $valueKey,
                    'label' => str_replace('_', ' ', (string) $valueKey),
                ],
            ],
        ];
    }

    private function firstMatchingKey(array $row, array $candidates): string
    {
        foreach ($candidates as $candidate) {
            if (array_key_exists($candidate, $row)) {
                return $candidate;
            }
        }

        return (string) array_key_first($row);
    }
}

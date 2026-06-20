<?php

namespace App\Analytics\Query;

use App\Analytics\Visualization\AnalyticsChartService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AnalyticsStructuredQueryService
{
    public function __construct(
        private AnalyticsChartService $chartService
    ) {}

    public function execute(array $scope, array $payload): array
    {
        $metric = (string) $payload['metric'];
        $dimension = (string) $payload['dimension'];
        $filters = is_array($payload['filters'] ?? null) ? $payload['filters'] : [];

        $rows = match ($metric) {
            'attendance_rate', 'absence_count' => $this->attendanceMetric($metric, $dimension, $scope, $filters),
            'average_grade', 'pass_rate' => $this->gradeMetric($metric, $dimension, $scope, $filters),
            default => throw ValidationException::withMessages(['metric' => ['Unsupported analytics metric requested.']]),
        };

        return [
            'metric' => $metric,
            'dimension' => $dimension,
            'rows' => $rows,
            'chart' => $this->chartService->build((string) (config("analytics.metrics.$metric.default_chart", 'bar')), $rows),
        ];
    }

    private function attendanceMetric(string $metric, string $dimension, array $scope, array $filters): array
    {
        $dimensionSql = $this->attendanceDimensionSql($dimension);
        $query = DB::table('attendances')
            ->leftJoin('groupes', 'groupes.id', '=', 'attendances.group_id')
            ->leftJoin('modules', 'modules.id', '=', 'attendances.module_id')
            ->leftJoin('users', 'users.id', '=', 'attendances.student_id')
            ->when($scope['student_ids'] !== [], fn ($q) => $q->whereIn('attendances.student_id', $scope['student_ids']))
            ->when($scope['group_ids'] !== [], fn ($q) => $q->whereIn('attendances.group_id', $scope['group_ids']))
            ->when($scope['module_ids'] !== [], fn ($q) => $q->whereIn('attendances.module_id', $scope['module_ids']))
            ->when($filters['date_from'] ?? null, fn ($q, $value) => $q->where('attendances.date', '>=', $value))
            ->when($filters['date_to'] ?? null, fn ($q, $value) => $q->where('attendances.date', '<=', $value))
            ->when($filters['module_id'] ?? null, fn ($q, $value) => $q->where('attendances.module_id', (int) $value))
            ->when($filters['group_id'] ?? null, fn ($q, $value) => $q->where('attendances.group_id', (int) $value))
            ->selectRaw($dimensionSql.' as dimension_label')
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(CASE WHEN attendances.status IN ("present","late","retard") THEN 1 ELSE 0 END) as present_count')
            ->selectRaw('SUM(CASE WHEN attendances.status = "absent" THEN 1 ELSE 0 END) as absent_count')
            ->groupByRaw($dimensionSql)
            ->orderBy('dimension_label');

        return $query->get()->map(function ($row) use ($metric) {
            $attendanceRate = (int) $row->total > 0 ? round(((int) $row->present_count * 100) / (int) $row->total, 2) : 0;

            return [
                'label' => (string) $row->dimension_label,
                'attendance_rate' => $attendanceRate,
                'count' => $metric === 'absence_count' ? (int) $row->absent_count : $attendanceRate,
            ];
        })->values()->all();
    }

    private function gradeMetric(string $metric, string $dimension, array $scope, array $filters): array
    {
        $dimensionSql = $this->gradeDimensionSql($dimension);
        $query = DB::table('notes')
            ->join('evaluations', 'evaluations.id', '=', 'notes.evaluation_id')
            ->join('stagiaires', 'stagiaires.id', '=', 'notes.stagiaire_id')
            ->leftJoin('modules', 'modules.id', '=', 'evaluations.module_id')
            ->leftJoin('groupes', 'groupes.id', '=', 'evaluations.groupe_id')
            ->leftJoin('users', 'users.id', '=', 'stagiaires.user_id')
            ->when($scope['student_ids'] !== [], fn ($q) => $q->whereIn('stagiaires.user_id', $scope['student_ids']))
            ->when($scope['group_ids'] !== [], fn ($q) => $q->whereIn('evaluations.groupe_id', $scope['group_ids']))
            ->when($scope['module_ids'] !== [], fn ($q) => $q->whereIn('evaluations.module_id', $scope['module_ids']))
            ->when($filters['date_from'] ?? null, fn ($q, $value) => $q->where('evaluations.date', '>=', $value))
            ->when($filters['date_to'] ?? null, fn ($q, $value) => $q->where('evaluations.date', '<=', $value))
            ->when($filters['module_id'] ?? null, fn ($q, $value) => $q->where('evaluations.module_id', (int) $value))
            ->when($filters['group_id'] ?? null, fn ($q, $value) => $q->where('evaluations.groupe_id', (int) $value))
            ->selectRaw($dimensionSql.' as dimension_label')
            ->selectRaw('AVG(notes.valeur) as avg_grade')
            ->selectRaw('SUM(CASE WHEN notes.valeur >= 10 THEN 1 ELSE 0 END) as pass_count')
            ->selectRaw('COUNT(*) as total')
            ->groupByRaw($dimensionSql)
            ->orderBy('dimension_label');

        return $query->get()->map(function ($row) use ($metric) {
            $avgGrade = round((float) $row->avg_grade, 2);
            $passRate = (int) $row->total > 0 ? round(((int) $row->pass_count * 100) / (int) $row->total, 2) : 0;

            return [
                'label' => (string) $row->dimension_label,
                'avg_grade' => $avgGrade,
                'count' => $metric === 'pass_rate' ? $passRate : $avgGrade,
            ];
        })->values()->all();
    }

    private function attendanceDimensionSql(string $dimension): string
    {
        return match ($dimension) {
            'day' => 'DATE(attendances.date)',
            'week' => 'DATE_FORMAT(attendances.date, "%x-W%v")',
            'month' => 'DATE_FORMAT(attendances.date, "%Y-%m")',
            'group' => 'COALESCE(groupes.label, groupes.name, CONCAT("Group #", attendances.group_id))',
            'module' => 'COALESCE(modules.code, modules.name, CONCAT("Module #", attendances.module_id))',
            'student' => 'COALESCE(users.name, CONCAT("Student #", attendances.student_id))',
            default => throw ValidationException::withMessages(['dimension' => ['Unsupported attendance dimension requested.']]),
        };
    }

    private function gradeDimensionSql(string $dimension): string
    {
        return match ($dimension) {
            'week' => 'DATE_FORMAT(evaluations.date, "%x-W%v")',
            'month' => 'DATE_FORMAT(evaluations.date, "%Y-%m")',
            'group' => 'COALESCE(groupes.label, groupes.name, CONCAT("Group #", evaluations.groupe_id))',
            'module' => 'COALESCE(modules.code, modules.name, CONCAT("Module #", evaluations.module_id))',
            'student' => 'COALESCE(users.name, CONCAT("Student #", stagiaires.user_id))',
            default => throw ValidationException::withMessages(['dimension' => ['Unsupported grade dimension requested.']]),
        };
    }
}

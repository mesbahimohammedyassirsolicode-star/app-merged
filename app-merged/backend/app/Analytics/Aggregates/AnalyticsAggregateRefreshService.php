<?php

namespace App\Analytics\Aggregates;

use App\Services\StudentInsightService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

class AnalyticsAggregateRefreshService
{
    public function __construct(
        private StudentInsightService $studentInsightService
    ) {}

    public function refresh(?string $dateFrom = null, ?string $dateTo = null): array
    {
        $range = $this->normalizeDateRange($dateFrom, $dateTo);

        return DB::transaction(function () use ($range) {
            $studentDailyRows = $this->buildStudentDailyRows($range['date_from'], $range['date_to']);
            $groupDailyRows = $this->buildGroupDailyRows($studentDailyRows);
            $monthlyRiskRows = $this->buildMonthlyRiskRows($studentDailyRows);

            $this->replaceRange('analytics_daily_student_metrics', 'metric_date', $range['date_from'], $range['date_to'], $studentDailyRows);
            $this->replaceRange('analytics_daily_group_metrics', 'metric_date', $range['date_from'], $range['date_to'], $groupDailyRows);
            $this->replaceMonthRange('analytics_monthly_student_risk', $range['month_from'], $range['month_to'], $monthlyRiskRows);

            return [
                'date_from' => $range['date_from'],
                'date_to' => $range['date_to'],
                'month_from' => $range['month_from'],
                'month_to' => $range['month_to'],
                'student_daily_count' => count($studentDailyRows),
                'group_daily_count' => count($groupDailyRows),
                'monthly_risk_count' => count($monthlyRiskRows),
            ];
        });
    }

    private function buildStudentDailyRows(string $dateFrom, string $dateTo): array
    {
        $attendanceRows = DB::table('attendances')
            ->leftJoin('stagiaires', 'stagiaires.user_id', '=', 'attendances.student_id')
            ->selectRaw('attendances.student_id')
            ->selectRaw('stagiaires.groupe_id')
            ->selectRaw('stagiaires.filiere_id')
            ->selectRaw('attendances.module_id')
            ->selectRaw('DATE(attendances.date) as metric_date')
            ->selectRaw('COUNT(*) as total_count')
            ->selectRaw('SUM(CASE WHEN attendances.status IN ("present","late","retard") THEN 1 ELSE 0 END) as present_count')
            ->selectRaw('SUM(CASE WHEN attendances.status = "absent" THEN 1 ELSE 0 END) as absence_count')
            ->selectRaw('SUM(CASE WHEN attendances.status IN ("late","retard") THEN 1 ELSE 0 END) as late_count')
            ->whereNotNull('attendances.student_id')
            ->whereNotNull('attendances.date')
            ->whereBetween('attendances.date', [$dateFrom, $dateTo])
            ->groupBy('attendances.student_id', 'stagiaires.groupe_id', 'stagiaires.filiere_id', 'attendances.module_id', DB::raw('DATE(attendances.date)'))
            ->get();

        $gradeRows = DB::table('notes')
            ->join('evaluations', 'evaluations.id', '=', 'notes.evaluation_id')
            ->join('stagiaires', 'stagiaires.id', '=', 'notes.stagiaire_id')
            ->selectRaw('stagiaires.user_id as student_id')
            ->selectRaw('stagiaires.groupe_id')
            ->selectRaw('stagiaires.filiere_id')
            ->selectRaw('evaluations.module_id')
            ->selectRaw('DATE(evaluations.date) as metric_date')
            ->selectRaw('AVG(notes.valeur) as average_grade')
            ->selectRaw('SUM(CASE WHEN notes.valeur >= 10 THEN 1 ELSE 0 END) as pass_count')
            ->selectRaw('COUNT(notes.id) as notes_count')
            ->whereNotNull('evaluations.date')
            ->whereBetween('evaluations.date', [$dateFrom, $dateTo])
            ->groupBy('stagiaires.user_id', 'stagiaires.groupe_id', 'stagiaires.filiere_id', 'evaluations.module_id', DB::raw('DATE(evaluations.date)'))
            ->get();

        $rowsByKey = [];

        foreach ($attendanceRows as $row) {
            $key = $this->dailyKey((int) $row->student_id, (int) ($row->module_id ?? 0), (string) $row->metric_date);
            $rowsByKey[$key] = [
                'student_id' => (int) $row->student_id,
                'groupe_id' => $row->groupe_id ? (int) $row->groupe_id : null,
                'filiere_id' => $row->filiere_id ? (int) $row->filiere_id : null,
                'module_id' => $row->module_id ? (int) $row->module_id : null,
                'metric_date' => (string) $row->metric_date,
                'attendance_rate' => (int) $row->total_count > 0 ? round(((int) $row->present_count * 100) / (int) $row->total_count, 2) : 0,
                'absence_count' => (int) $row->absence_count,
                'late_count' => (int) $row->late_count,
                'average_grade' => 0,
                'pass_rate' => 0,
                'risk_score' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        foreach ($gradeRows as $row) {
            $key = $this->dailyKey((int) $row->student_id, (int) ($row->module_id ?? 0), (string) $row->metric_date);
            if (! isset($rowsByKey[$key])) {
                $rowsByKey[$key] = [
                    'student_id' => (int) $row->student_id,
                    'groupe_id' => $row->groupe_id ? (int) $row->groupe_id : null,
                    'filiere_id' => $row->filiere_id ? (int) $row->filiere_id : null,
                    'module_id' => $row->module_id ? (int) $row->module_id : null,
                    'metric_date' => (string) $row->metric_date,
                    'attendance_rate' => 0,
                    'absence_count' => 0,
                    'late_count' => 0,
                    'average_grade' => 0,
                    'pass_rate' => 0,
                    'risk_score' => 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            $averageGrade = round((float) $row->average_grade, 2);
            $passRate = (int) $row->notes_count > 0 ? round(((int) $row->pass_count * 100) / (int) $row->notes_count, 2) : 0;
            $rowsByKey[$key]['average_grade'] = $averageGrade;
            $rowsByKey[$key]['pass_rate'] = $passRate;

            $risk = $this->studentInsightService->buildInsight($averageGrade, (float) $rowsByKey[$key]['attendance_rate']);
            $rowsByKey[$key]['risk_score'] = $risk['risk_score'];
        }

        foreach ($rowsByKey as &$row) {
            if ((float) $row['risk_score'] === 0.0 && ((float) $row['average_grade'] > 0 || (float) $row['attendance_rate'] > 0)) {
                $risk = $this->studentInsightService->buildInsight((float) $row['average_grade'], (float) $row['attendance_rate']);
                $row['risk_score'] = $risk['risk_score'];
            }
        }

        return array_values($rowsByKey);
    }

    private function buildGroupDailyRows(array $studentDailyRows): array
    {
        $sourceRows = collect($studentDailyRows);

        $grouped = [];

        foreach ($sourceRows as $row) {
            $row = (object) $row;
            $groupId = (int) ($row->groupe_id ?? 0);
            if ($groupId === 0) {
                continue;
            }

            $key = implode('|', [$groupId, (int) ($row->module_id ?? 0), (string) $row->metric_date]);
            if (! isset($grouped[$key])) {
                $grouped[$key] = [
                    'groupe_id' => $groupId,
                    'filiere_id' => $row->filiere_id ? (int) $row->filiere_id : null,
                    'module_id' => $row->module_id ? (int) $row->module_id : null,
                    'metric_date' => (string) $row->metric_date,
                    'student_ids' => [],
                    'attendance_rate_sum' => 0,
                    'absence_count' => 0,
                    'late_count' => 0,
                    'average_grade_sum' => 0,
                    'graded_count' => 0,
                    'pass_rate_sum' => 0,
                    'risk_score_sum' => 0,
                    'high_risk_count' => 0,
                ];
            }

            $grouped[$key]['student_ids'][(int) $row->student_id] = true;
            $grouped[$key]['attendance_rate_sum'] += (float) $row->attendance_rate;
            $grouped[$key]['absence_count'] += (int) $row->absence_count;
            $grouped[$key]['late_count'] += (int) $row->late_count;
            $grouped[$key]['risk_score_sum'] += (float) $row->risk_score;

            if ((float) $row->average_grade > 0) {
                $grouped[$key]['average_grade_sum'] += (float) $row->average_grade;
                $grouped[$key]['pass_rate_sum'] += (float) $row->pass_rate;
                $grouped[$key]['graded_count']++;
            }

            if ((float) $row->risk_score >= 65) {
                $grouped[$key]['high_risk_count']++;
            }
        }

        $rows = [];
        foreach ($grouped as $item) {
            $studentCount = count($item['student_ids']);
            $rows[] = [
                'groupe_id' => $item['groupe_id'],
                'filiere_id' => $item['filiere_id'],
                'module_id' => $item['module_id'],
                'metric_date' => $item['metric_date'],
                'student_count' => $studentCount,
                'attendance_rate' => $studentCount > 0 ? round($item['attendance_rate_sum'] / $studentCount, 2) : 0,
                'absence_count' => $item['absence_count'],
                'late_count' => $item['late_count'],
                'average_grade' => $item['graded_count'] > 0 ? round($item['average_grade_sum'] / $item['graded_count'], 2) : 0,
                'pass_rate' => $item['graded_count'] > 0 ? round($item['pass_rate_sum'] / $item['graded_count'], 2) : 0,
                'high_risk_count' => $item['high_risk_count'],
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        return $rows;
    }

    private function buildMonthlyRiskRows(array $studentDailyRows): array
    {
        $sourceRows = collect($studentDailyRows)->sortBy('metric_date')->values();

        $grouped = [];

        foreach ($sourceRows as $row) {
            $row = (object) $row;
            $monthKey = CarbonImmutable::parse((string) $row->metric_date)->format('Y-m');
            $key = implode('|', [(int) $row->student_id, $monthKey]);
            if (! isset($grouped[$key])) {
                $grouped[$key] = [
                    'student_id' => (int) $row->student_id,
                    'groupe_id' => $row->groupe_id ? (int) $row->groupe_id : null,
                    'filiere_id' => $row->filiere_id ? (int) $row->filiere_id : null,
                    'month_key' => $monthKey,
                    'attendance_rate_sum' => 0,
                    'attendance_count' => 0,
                    'grade_sum' => 0,
                    'grade_count' => 0,
                    'absence_count' => 0,
                    'late_count' => 0,
                ];
            }

            $grouped[$key]['attendance_rate_sum'] += (float) $row->attendance_rate;
            $grouped[$key]['attendance_count']++;
            $grouped[$key]['absence_count'] += (int) $row->absence_count;
            $grouped[$key]['late_count'] += (int) $row->late_count;

            if ((float) $row->average_grade > 0) {
                $grouped[$key]['grade_sum'] += (float) $row->average_grade;
                $grouped[$key]['grade_count']++;
            }
        }

        $rows = [];
        foreach ($grouped as $item) {
            $attendanceRate = $item['attendance_count'] > 0 ? round($item['attendance_rate_sum'] / $item['attendance_count'], 2) : 0;
            $averageGrade = $item['grade_count'] > 0 ? round($item['grade_sum'] / $item['grade_count'], 2) : 0;
            $risk = $this->studentInsightService->buildInsight($averageGrade, $attendanceRate);

            $drivers = array_values(array_filter([
                $averageGrade < 10 ? 'low_grade_average' : null,
                $attendanceRate < 80 ? 'low_attendance' : null,
                $item['absence_count'] >= 3 ? 'absence_pattern' : null,
                $item['late_count'] >= 3 ? 'late_arrivals' : null,
            ]));

            $rows[] = [
                'student_id' => $item['student_id'],
                'groupe_id' => $item['groupe_id'],
                'filiere_id' => $item['filiere_id'],
                'month_key' => $item['month_key'],
                'risk_score' => $risk['risk_score'],
                'risk_level' => $risk['risk_level'],
                'drivers' => json_encode($drivers, JSON_UNESCAPED_UNICODE),
                'recommendations' => json_encode($risk['recommendations'], JSON_UNESCAPED_UNICODE),
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        return $rows;
    }

    private function replaceRange(string $table, string $dateColumn, string $dateFrom, string $dateTo, array $rows): void
    {
        DB::table($table)->whereBetween($dateColumn, [$dateFrom, $dateTo])->delete();

        if ($rows !== []) {
            foreach (array_chunk($rows, 500) as $chunk) {
                DB::table($table)->insert($chunk);
            }
        }
    }

    private function replaceMonthRange(string $table, string $monthFrom, string $monthTo, array $rows): void
    {
        DB::table($table)->whereBetween('month_key', [$monthFrom, $monthTo])->delete();

        if ($rows !== []) {
            foreach (array_chunk($rows, 500) as $chunk) {
                DB::table($table)->insert($chunk);
            }
        }
    }

    private function normalizeDateRange(?string $dateFrom, ?string $dateTo): array
    {
        $to = $dateTo ? CarbonImmutable::parse($dateTo) : CarbonImmutable::today();
        $from = $dateFrom ? CarbonImmutable::parse($dateFrom) : $to->subDays(30);

        if ($from->greaterThan($to)) {
            [$from, $to] = [$to, $from];
        }

        return [
            'date_from' => $from->toDateString(),
            'date_to' => $to->toDateString(),
            'month_from' => $from->startOfMonth()->format('Y-m'),
            'month_to' => $to->startOfMonth()->format('Y-m'),
        ];
    }

    private function dailyKey(int $studentId, int $moduleId, string $metricDate): string
    {
        return implode('|', [$studentId, $moduleId, $metricDate]);
    }
}

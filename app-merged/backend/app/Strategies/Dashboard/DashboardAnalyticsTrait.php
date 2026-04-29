<?php

namespace App\Strategies\Dashboard;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

trait DashboardAnalyticsTrait
{
    protected function sqlMonthBucketExpression(): string
    {
        return DB::connection()->getDriverName() === 'sqlite'
            ? "strftime('%Y-%m', date)"
            : "DATE_FORMAT(date, '%Y-%m')";
    }

    protected function monthlyAttendanceSummary(Builder $baseQuery, int $months = 6): array
    {
        $end = now()->endOfMonth();
        $start = now()->subMonths(max($months - 1, 0))->startOfMonth();
        $monthExpr = $this->sqlMonthBucketExpression();

        $rows = (clone $baseQuery)
            ->whereBetween('date', [$start->toDateString(), $end->toDateString()])
            ->selectRaw("
                {$monthExpr} as month,
                COUNT(*) as total_count,
                SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as present_count,
                SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as absent_count,
                SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as late_count
            ", ['present', 'absent', 'late'])
            ->groupBy(DB::raw($monthExpr))
            ->orderBy(DB::raw($monthExpr))
            ->get()
            ->keyBy('month');

        $result = [];
        $cursor = $start->copy();
        while ($cursor <= $end) {
            $monthKey = $cursor->format('Y-m');
            $row = $rows->get($monthKey);
            $total = (int) ($row->total_count ?? 0);
            $present = (int) ($row->present_count ?? 0);
            $absent = (int) ($row->absent_count ?? 0);
            $late = (int) ($row->late_count ?? 0);
            $attendanceRate = $total > 0 ? round((($present + $late) / $total) * 100, 2) : 0.0;
            $absenceRate = $total > 0 ? round(($absent / $total) * 100, 2) : 0.0;
            $result[] = [
                'month' => $monthKey,
                'total_count' => $total,
                'present_count' => $present,
                'absent_count' => $absent,
                'late_count' => $late,
                'attendance_rate_percent' => $attendanceRate,
                'absence_rate_percent' => $absenceRate,
            ];
            $cursor->addMonth();
        }

        return $result;
    }

    protected function singleWindowSummary(Builder $baseQuery, Carbon $from, Carbon $to): array
    {
        $counts = (clone $baseQuery)
            ->whereBetween('date', [$from->toDateString(), $to->toDateString()])
            ->selectRaw('
                COUNT(*) as total_count,
                SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as present_count,
                SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as absent_count,
                SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as late_count
            ', ['present', 'absent', 'late'])
            ->first();

        $total = (int) ($counts?->total_count ?? 0);
        $present = (int) ($counts?->present_count ?? 0);
        $absent = (int) ($counts?->absent_count ?? 0);
        $late = (int) ($counts?->late_count ?? 0);

        return [
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'total_count' => $total,
            'present_count' => $present,
            'absent_count' => $absent,
            'late_count' => $late,
            'attendance_rate_percent' => $total > 0 ? round((($present + $late) / $total) * 100, 2) : 0.0,
            'absence_rate_percent' => $total > 0 ? round(($absent / $total) * 100, 2) : 0.0,
        ];
    }
}

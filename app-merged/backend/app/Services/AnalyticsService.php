<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\Note;
use App\Models\Stagiaire;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class AnalyticsService
{
    public function __construct(
        private StudentInsightService $studentInsightService
    ) {}

    public function getOverview(User $user, array $filters): array
    {
        $cacheKey = 'analytics_overview_'.md5($user->id.'|'.$user->role.'|'.json_encode($filters));

        return Cache::remember($cacheKey, 120, function () use ($user, $filters) {
            $scopes = $this->resolveScope($user);
            $gradeRows = $this->gradeDistribution($scopes, $filters);
            $progressRows = $this->progressOverTime($scopes, $filters);
            $attendanceRows = $this->attendanceTrends($scopes, $filters);
            $insights = $this->riskInsights($scopes, $filters);

            return [
                'kpis' => [
                    'total_students' => $scopes['student_ids']->count(),
                    'active_modules' => $scopes['module_ids']->count(),
                    'attendance_rate' => $attendanceRows['global_rate'],
                    'average_grade' => $gradeRows['average_grade'],
                ],
                'charts' => [
                    'grade_distribution' => $gradeRows['distribution'],
                    'progress_over_time' => $progressRows,
                    'attendance_trends' => $attendanceRows['timeline'],
                ],
                'ai' => [
                    'at_risk_students' => $insights['at_risk_students'],
                    'recommendations' => $insights['recommendations'],
                ],
            ];
        });
    }

    private function resolveScope(User $user): array
    {
        if (in_array($user->role, ['admin', 'directeur', 'secretariat'], true)) {
            return [
                'student_ids' => DB::table('stagiaires')->pluck('user_id')->filter()->values(),
                'module_ids' => DB::table('modules')->pluck('id')->values(),
                'group_ids' => DB::table('groupes')->pluck('id')->values(),
            ];
        }

        if (in_array($user->role, ['teacher', 'formateur'], true)) {
            $rows = DB::table('formateur_module_group')
                ->where('user_id', $user->id)
                ->get(['module_id', 'groupe_id']);
            $groupIds = $rows->pluck('groupe_id')->unique()->values();
            $studentIds = DB::table('stagiaires')
                ->whereIn('groupe_id', $groupIds)
                ->pluck('user_id')
                ->filter()
                ->values();

            return [
                'student_ids' => $studentIds,
                'module_ids' => $rows->pluck('module_id')->unique()->values(),
                'group_ids' => $groupIds,
            ];
        }

        if ($user->role === 'parent') {
            $parent = $user->parent;
            if (! $parent) {
                return ['student_ids' => collect(), 'module_ids' => collect(), 'group_ids' => collect()];
            }
            $stagiaires = $parent->stagiaires()->get(['stagiaires.id', 'stagiaires.user_id', 'stagiaires.groupe_id']);
            $groupIds = $stagiaires->pluck('groupe_id')->filter()->unique()->values();
            $moduleIds = DB::table('groupe_module')
                ->whereIn('groupe_id', $groupIds)
                ->pluck('module_id')
                ->unique()
                ->values();

            return [
                'student_ids' => $stagiaires->pluck('user_id')->filter()->values(),
                'module_ids' => $moduleIds,
                'group_ids' => $groupIds,
            ];
        }

        $student = $user->stagiaire;
        if (! $student) {
            return ['student_ids' => collect(), 'module_ids' => collect(), 'group_ids' => collect()];
        }

        $moduleIds = DB::table('groupe_module')
            ->where('groupe_id', $student->groupe_id)
            ->pluck('module_id')
            ->unique()
            ->values();

        return [
            'student_ids' => collect([$student->user_id]),
            'module_ids' => $moduleIds,
            'group_ids' => collect([$student->groupe_id])->filter()->values(),
        ];
    }

    private function applyFilters($query, array $scopes, array $filters)
    {
        return $query
            ->when($scopes['student_ids']->isNotEmpty(), fn ($q) => $q->whereIn('student_id', $scopes['student_ids']->all()))
            ->when($filters['module_id'] ?? null, fn ($q, $v) => $q->where('module_id', (int) $v))
            ->when($filters['group_id'] ?? null, fn ($q, $v) => $q->where('group_id', (int) $v))
            ->when($filters['date_from'] ?? null, fn ($q, $v) => $q->whereDate('date', '>=', $v))
            ->when($filters['date_to'] ?? null, fn ($q, $v) => $q->whereDate('date', '<=', $v));
    }

    private function gradeDistribution(array $scopes, array $filters): array
    {
        $noteQuery = Note::query()
            ->join('evaluations', 'evaluations.id', '=', 'notes.evaluation_id')
            ->join('stagiaires', 'stagiaires.id', '=', 'notes.stagiaire_id')
            ->selectRaw('notes.valeur as grade, evaluations.date as date, evaluations.module_id, evaluations.groupe_id, stagiaires.user_id as student_id');

        $rows = $this->applyFilters($noteQuery, $scopes, $filters)->get();
        $buckets = [
            '0-5' => 0, '5-10' => 0, '10-12' => 0, '12-14' => 0, '14-16' => 0, '16-20' => 0,
        ];

        foreach ($rows as $row) {
            $grade = (float) $row->grade;
            if ($grade < 5) {
                $buckets['0-5']++;
            } elseif ($grade < 10) {
                $buckets['5-10']++;
            } elseif ($grade < 12) {
                $buckets['10-12']++;
            } elseif ($grade < 14) {
                $buckets['12-14']++;
            } elseif ($grade < 16) {
                $buckets['14-16']++;
            } else {
                $buckets['16-20']++;
            }
        }

        return [
            'distribution' => collect($buckets)->map(fn ($count, $bucket) => ['bucket' => $bucket, 'count' => $count])->values()->all(),
            'average_grade' => round((float) ($rows->avg('grade') ?? 0), 2),
        ];
    }

    private function progressOverTime(array $scopes, array $filters): array
    {
        $rows = Note::query()
            ->join('evaluations', 'evaluations.id', '=', 'notes.evaluation_id')
            ->join('stagiaires', 'stagiaires.id', '=', 'notes.stagiaire_id')
            ->selectRaw('DATE_FORMAT(evaluations.date, "%Y-%m") as period, AVG(notes.valeur) as avg_grade')
            ->when($scopes['student_ids']->isNotEmpty(), fn ($q) => $q->whereIn('stagiaires.user_id', $scopes['student_ids']->all()))
            ->when($filters['module_id'] ?? null, fn ($q, $v) => $q->where('evaluations.module_id', (int) $v))
            ->when($filters['group_id'] ?? null, fn ($q, $v) => $q->where('evaluations.groupe_id', (int) $v))
            ->when($filters['date_from'] ?? null, fn ($q, $v) => $q->whereDate('evaluations.date', '>=', $v))
            ->when($filters['date_to'] ?? null, fn ($q, $v) => $q->whereDate('evaluations.date', '<=', $v))
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        return $rows->map(fn ($row) => [
            'period' => $row->period,
            'avg_grade' => round((float) $row->avg_grade, 2),
        ])->values()->all();
    }

    private function attendanceTrends(array $scopes, array $filters): array
    {
        $rows = $this->applyFilters(Attendance::query(), $scopes, $filters)
            ->selectRaw('DATE_FORMAT(date, "%Y-%m") as period')
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(CASE WHEN status IN ("present","late","retard") THEN 1 ELSE 0 END) as present_count')
            ->selectRaw('SUM(CASE WHEN status = "absent" THEN 1 ELSE 0 END) as absent_count')
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        $timeline = $rows->map(fn ($row) => [
            'period' => $row->period,
            'attendance_rate' => $row->total > 0 ? round(((int) $row->present_count * 100) / (int) $row->total, 2) : 0,
            'absent_count' => (int) $row->absent_count,
        ])->values()->all();

        $totals = [
            'total' => (int) $rows->sum('total'),
            'present' => (int) $rows->sum('present_count'),
        ];

        return [
            'timeline' => $timeline,
            'global_rate' => $totals['total'] > 0 ? round(($totals['present'] * 100) / $totals['total'], 2) : 0,
        ];
    }

    private function riskInsights(array $scopes, array $filters): array
    {
        $studentIds = $scopes['student_ids']->all();
        if ($studentIds === []) {
            return ['at_risk_students' => [], 'recommendations' => []];
        }

        $students = Stagiaire::query()
            ->with('user:id,name')
            ->whereIn('user_id', $studentIds)
            ->get();

        $atRisk = [];
        foreach ($students as $student) {
            $avgGrade = (float) Note::query()
                ->join('evaluations', 'evaluations.id', '=', 'notes.evaluation_id')
                ->where('notes.stagiaire_id', $student->id)
                ->when($filters['module_id'] ?? null, fn ($q, $v) => $q->where('evaluations.module_id', (int) $v))
                ->when($filters['group_id'] ?? null, fn ($q, $v) => $q->where('evaluations.groupe_id', (int) $v))
                ->when($filters['date_from'] ?? null, fn ($q, $v) => $q->whereDate('evaluations.date', '>=', $v))
                ->when($filters['date_to'] ?? null, fn ($q, $v) => $q->whereDate('evaluations.date', '<=', $v))
                ->avg('notes.valeur');

            $attendanceRate = (float) $this->applyFilters(
                Attendance::query()->where('student_id', $student->user_id),
                ['student_ids' => collect([$student->user_id])],
                $filters
            )
                ->selectRaw('COUNT(*) as total, SUM(CASE WHEN status IN ("present","late","retard") THEN 1 ELSE 0 END) as present_count')
                ->get()
                ->map(fn ($row) => $row->total > 0 ? (($row->present_count * 100) / $row->total) : 0)
                ->first();

            $insight = $this->studentInsightService->buildInsight($avgGrade, $attendanceRate);
            if ($insight['risk_level'] !== 'low') {
                $atRisk[] = [
                    'student_id' => (int) $student->id,
                    'student_name' => (string) ($student->user?->name ?? 'Unknown'),
                    'average_grade' => round($avgGrade, 2),
                    'attendance_rate' => round($attendanceRate, 2),
                    ...$insight,
                ];
            }
        }

        return [
            'at_risk_students' => collect($atRisk)->sortByDesc('risk_score')->values()->take(10)->all(),
            'recommendations' => collect($atRisk)
                ->flatMap(fn ($row) => $row['recommendations'])
                ->unique()
                ->values()
                ->take(5)
                ->all(),
        ];
    }
}

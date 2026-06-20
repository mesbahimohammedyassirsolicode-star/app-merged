<?php

namespace App\Services;

use App\Analytics\Security\AnalyticsScopeResolver;
use App\Models\Attendance;
use App\Models\Note;
use App\Models\Stagiaire;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AnalyticsService
{
    public function __construct(
        private StudentInsightService $studentInsightService,
        private AnalyticsScopeResolver $scopeResolver,
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
            $counts = $this->filteredCounts($scopes, $filters);

            return [
                'kpis' => [
                    'total_students' => $counts['total_students'],
                    'total_teachers' => $counts['total_teachers'],
                    'total_filieres' => $counts['total_filieres'],
                    'total_groupes' => $counts['total_groupes'],
                    'active_modules' => $counts['active_modules'],
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

    public function topStudentsDataset(User $user, array $filters = []): array
    {
        $scope = $this->resolveScope($user);

        return Note::query()
            ->join('stagiaires', 'stagiaires.id', '=', 'notes.stagiaire_id')
            ->join('users', 'users.id', '=', 'stagiaires.user_id')
            ->join('evaluations', 'evaluations.id', '=', 'notes.evaluation_id')
            ->when($scope['student_ids']->isNotEmpty(), fn ($q) => $q->whereIn('stagiaires.user_id', $scope['student_ids']->all()))
            ->when($filters['module_id'] ?? null, fn ($q, $v) => $q->where('evaluations.module_id', (int) $v))
            ->when($filters['group_id'] ?? null, fn ($q, $v) => $q->where('evaluations.groupe_id', (int) $v))
            ->when($filters['date_from'] ?? null, fn ($q, $v) => $q->where('evaluations.date', '>=', $v))
            ->when($filters['date_to'] ?? null, fn ($q, $v) => $q->where('evaluations.date', '<=', $v))
            ->selectRaw('stagiaires.id as stagiaire_id, users.name as student_name, AVG(notes.valeur) as avg_grade')
            ->groupBy('stagiaires.id', 'users.name')
            ->orderByDesc('avg_grade')
            ->limit(10)
            ->get()
            ->map(fn ($row) => [
                'stagiaire_id' => (int) $row->stagiaire_id,
                'student_name' => (string) $row->student_name,
                'avg_grade' => round((float) $row->avg_grade, 2),
            ])
            ->values()
            ->all();
    }

    public function gradesByModuleDataset(User $user, array $filters = []): array
    {
        $scope = $this->resolveScope($user);

        return Note::query()
            ->join('evaluations', 'evaluations.id', '=', 'notes.evaluation_id')
            ->join('modules', 'modules.id', '=', 'evaluations.module_id')
            ->join('stagiaires', 'stagiaires.id', '=', 'notes.stagiaire_id')
            ->when($scope['student_ids']->isNotEmpty(), fn ($q) => $q->whereIn('stagiaires.user_id', $scope['student_ids']->all()))
            ->when($scope['module_ids']->isNotEmpty(), fn ($q) => $q->whereIn('modules.id', $scope['module_ids']->all()))
            ->when($filters['module_id'] ?? null, fn ($q, $v) => $q->where('evaluations.module_id', (int) $v))
            ->when($filters['group_id'] ?? null, fn ($q, $v) => $q->where('evaluations.groupe_id', (int) $v))
            ->when($filters['date_from'] ?? null, fn ($q, $v) => $q->where('evaluations.date', '>=', $v))
            ->when($filters['date_to'] ?? null, fn ($q, $v) => $q->where('evaluations.date', '<=', $v))
            ->selectRaw('modules.id as module_id, modules.code as module_code, COALESCE(modules.label, modules.name) as module_label, AVG(notes.valeur) as avg_grade, COUNT(notes.id) as total_notes')
            ->groupBy('modules.id', 'modules.code', 'modules.label', 'modules.name')
            ->orderByDesc('avg_grade')
            ->limit(25)
            ->get()
            ->map(fn ($row) => [
                'module_id' => (int) $row->module_id,
                'module_code' => (string) $row->module_code,
                'module_label' => (string) $row->module_label,
                'avg_grade' => round((float) $row->avg_grade, 2),
                'total_notes' => (int) $row->total_notes,
            ])
            ->values()
            ->all();
    }

    private function resolveScope(User $user): array
    {
        $resolved = $this->scopeResolver->resolve($user);

        return [
            'student_ids' => collect($resolved['student_ids'] ?? []),
            'student_record_ids' => collect($resolved['student_record_ids'] ?? []),
            'module_ids' => collect($resolved['module_ids'] ?? []),
            'group_ids' => collect($resolved['group_ids'] ?? []),
            'filiere_ids' => collect($resolved['filiere_ids'] ?? []),
        ];
    }

    private function applyFilters($query, array $scopes, array $filters, array $columns = [])
    {
        $colStudentId = $columns['student_id'] ?? 'student_id';
        $colModuleId = $columns['module_id'] ?? 'module_id';
        $colGroupId = $columns['group_id'] ?? 'group_id';
        $colFiliereId = $columns['filiere_id'] ?? 'filiere_id';
        $colDate = $columns['date'] ?? 'date';

        return $query
            ->when($scopes['student_ids']->isNotEmpty(), fn ($q) => $q->whereIn($colStudentId, $scopes['student_ids']->all()))
            ->when($scopes['filiere_ids']->isNotEmpty(), fn ($q) => $q->whereIn($colFiliereId, $scopes['filiere_ids']->all()))
            ->when($filters['module_id'] ?? null, fn ($q, $v) => $q->where($colModuleId, (int) $v))
            ->when($filters['group_id'] ?? null, fn ($q, $v) => $q->where($colGroupId, (int) $v))
            ->when($filters['filiere_id'] ?? null, fn ($q, $v) => $q->where($colFiliereId, (int) $v))
            ->when($filters['date_from'] ?? null, fn ($q, $v) => $q->whereDate($colDate, '>=', $v))
            ->when($filters['date_to'] ?? null, fn ($q, $v) => $q->whereDate($colDate, '<=', $v));
    }

    private function gradeDistribution(array $scopes, array $filters): array
    {
        $noteQuery = Note::query()
            ->join('evaluations', 'evaluations.id', '=', 'notes.evaluation_id')
            ->join('stagiaires', 'stagiaires.id', '=', 'notes.stagiaire_id')
            ->selectRaw('notes.valeur as grade, evaluations.date as date, evaluations.module_id, evaluations.groupe_id, stagiaires.user_id as student_id');

        $rows = $this->applyFilters($noteQuery, $scopes, $filters, [
            'student_id' => 'stagiaires.user_id',
            'module_id' => 'evaluations.module_id',
            'group_id' => 'evaluations.groupe_id',
            'filiere_id' => 'stagiaires.filiere_id',
            'date' => 'evaluations.date',
        ])->get();
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
        $periodExpression = $this->monthExpression('evaluations.date');

        $rows = Note::query()
            ->join('evaluations', 'evaluations.id', '=', 'notes.evaluation_id')
            ->join('stagiaires', 'stagiaires.id', '=', 'notes.stagiaire_id')
            ->selectRaw($periodExpression.' as period, AVG(notes.valeur) as avg_grade')
            ->when($scopes['student_ids']->isNotEmpty(), fn ($q) => $q->whereIn('stagiaires.user_id', $scopes['student_ids']->all()))
            ->when($scopes['filiere_ids']->isNotEmpty(), fn ($q) => $q->whereIn('stagiaires.filiere_id', $scopes['filiere_ids']->all()))
            ->when($filters['module_id'] ?? null, fn ($q, $v) => $q->where('evaluations.module_id', (int) $v))
            ->when($filters['group_id'] ?? null, fn ($q, $v) => $q->where('evaluations.groupe_id', (int) $v))
            ->when($filters['filiere_id'] ?? null, fn ($q, $v) => $q->where('stagiaires.filiere_id', (int) $v))
            ->when($filters['date_from'] ?? null, fn ($q, $v) => $q->whereDate('evaluations.date', '>=', $v))
            ->when($filters['date_to'] ?? null, fn ($q, $v) => $q->whereDate('evaluations.date', '<=', $v))
            ->groupByRaw($periodExpression)
            ->orderBy('period')
            ->get();

        return $rows->map(fn ($row) => [
            'period' => $row->period,
            'avg_grade' => round((float) $row->avg_grade, 2),
        ])->values()->all();
    }

    private function attendanceTrends(array $scopes, array $filters): array
    {
        $periodExpression = $this->monthExpression('date');

        $rows = $this->applyFilters(Attendance::query(), $scopes, $filters, [
            'student_id' => 'student_id',
            'module_id' => 'module_id',
            'group_id' => 'group_id',
            'filiere_id' => 'filiere_id',
            'date' => 'date',
        ])
            ->selectRaw($periodExpression.' as period')
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(CASE WHEN status IN ("present","late","retard") THEN 1 ELSE 0 END) as present_count')
            ->selectRaw('SUM(CASE WHEN status = "absent" THEN 1 ELSE 0 END) as absent_count')
            ->groupByRaw($periodExpression)
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
        $studentRecordIds = $scopes['student_record_ids']->all();
        if ($studentIds === [] || $studentRecordIds === []) {
            return ['at_risk_students' => [], 'recommendations' => []];
        }

        $students = Stagiaire::query()
            ->with('user:id,name')
            ->whereIn('id', $studentRecordIds)
            ->get();

        $gradeAverages = Note::query()
            ->join('evaluations', 'evaluations.id', '=', 'notes.evaluation_id')
            ->join('stagiaires', 'stagiaires.id', '=', 'notes.stagiaire_id')
            ->whereIn('notes.stagiaire_id', $studentRecordIds)
            ->when($scopes['filiere_ids']->isNotEmpty(), fn ($q) => $q->whereIn('stagiaires.filiere_id', $scopes['filiere_ids']->all()))
            ->when($filters['module_id'] ?? null, fn ($q, $v) => $q->where('evaluations.module_id', (int) $v))
            ->when($filters['group_id'] ?? null, fn ($q, $v) => $q->where('evaluations.groupe_id', (int) $v))
            ->when($filters['filiere_id'] ?? null, fn ($q, $v) => $q->where('stagiaires.filiere_id', (int) $v))
            ->when($filters['date_from'] ?? null, fn ($q, $v) => $q->where('evaluations.date', '>=', $v))
            ->when($filters['date_to'] ?? null, fn ($q, $v) => $q->where('evaluations.date', '<=', $v))
            ->selectRaw('notes.stagiaire_id, AVG(notes.valeur) as avg_grade')
            ->groupBy('notes.stagiaire_id')
            ->get()
            ->mapWithKeys(fn ($row) => [(int) $row->stagiaire_id => (float) $row->avg_grade]);

        $attendanceStats = Attendance::query()
            ->whereIn('student_id', $studentIds)
            ->when($filters['module_id'] ?? null, fn ($q, $v) => $q->where('module_id', (int) $v))
            ->when($filters['group_id'] ?? null, fn ($q, $v) => $q->where('group_id', (int) $v))
            ->when($scopes['filiere_ids']->isNotEmpty(), fn ($q) => $q->whereIn('filiere_id', $scopes['filiere_ids']->all()))
            ->when($filters['filiere_id'] ?? null, fn ($q, $v) => $q->where('filiere_id', (int) $v))
            ->when($filters['date_from'] ?? null, fn ($q, $v) => $q->where('date', '>=', $v))
            ->when($filters['date_to'] ?? null, fn ($q, $v) => $q->where('date', '<=', $v))
            ->selectRaw('student_id, COUNT(*) as total, SUM(CASE WHEN status IN ("present","late","retard") THEN 1 ELSE 0 END) as present_count')
            ->groupBy('student_id')
            ->get()
            ->keyBy('student_id');

        $atRisk = [];
        foreach ($students as $student) {
            $avgGrade = round((float) ($gradeAverages[$student->id] ?? 0), 2);
            $attendanceRow = $attendanceStats->get($student->user_id);
            $attendanceRate = ($attendanceRow && (int) $attendanceRow->total > 0)
                ? round(((int) $attendanceRow->present_count * 100) / (int) $attendanceRow->total, 2)
                : 0;

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

    private function monthExpression(string $column): string
    {
        return Schema::getConnection()->getDriverName() === 'sqlite'
            ? "strftime('%Y-%m', {$column})"
            : "DATE_FORMAT({$column}, '%Y-%m')";
    }

    private function filteredCounts(array $scopes, array $filters): array
    {
        $totalStudents = Stagiaire::query()
            ->when($scopes['student_record_ids']->isNotEmpty(), fn ($q) => $q->whereIn('id', $scopes['student_record_ids']->all()))
            ->when($scopes['filiere_ids']->isNotEmpty(), fn ($q) => $q->whereIn('filiere_id', $scopes['filiere_ids']->all()))
            ->when($filters['group_id'] ?? null, fn ($q, $v) => $q->where('groupe_id', (int) $v))
            ->when($filters['filiere_id'] ?? null, fn ($q, $v) => $q->where('filiere_id', (int) $v))
            ->count();

        $totalTeachers = DB::table('formateurs')
            ->when($filters['filiere_id'] ?? null, fn ($q, $v) => $q->where('filiere_id', (int) $v))
            ->count();

        $totalFilieres = DB::table('filieres')
            ->when($scopes['filiere_ids']->isNotEmpty(), fn ($q) => $q->whereIn('id', $scopes['filiere_ids']->all()))
            ->when($filters['filiere_id'] ?? null, fn ($q, $v) => $q->where('id', (int) $v))
            ->count();

        $totalGroupes = DB::table('groupes')
            ->when($scopes['group_ids']->isNotEmpty(), fn ($q) => $q->whereIn('id', $scopes['group_ids']->all()))
            ->when($scopes['filiere_ids']->isNotEmpty(), fn ($q) => $q->whereIn('filiere_id', $scopes['filiere_ids']->all()))
            ->when($filters['group_id'] ?? null, fn ($q, $v) => $q->where('id', (int) $v))
            ->when($filters['filiere_id'] ?? null, fn ($q, $v) => $q->where('filiere_id', (int) $v))
            ->count();

        $activeModules = DB::table('modules')
            ->when($scopes['module_ids']->isNotEmpty(), fn ($q) => $q->whereIn('id', $scopes['module_ids']->all()))
            ->when($scopes['filiere_ids']->isNotEmpty(), fn ($q) => $q->whereIn('filiere_id', $scopes['filiere_ids']->all()))
            ->when($filters['module_id'] ?? null, fn ($q, $v) => $q->where('id', (int) $v))
            ->when($filters['filiere_id'] ?? null, fn ($q, $v) => $q->where('filiere_id', (int) $v))
            ->when($filters['group_id'] ?? null, function ($q, $v) {
                $q->whereExists(function ($sub) use ($v) {
                    $sub->select(DB::raw(1))
                        ->from('module_groupe')
                        ->whereColumn('module_groupe.module_id', 'modules.id')
                        ->where('module_groupe.groupe_id', (int) $v);
                });
            })
            ->count();

        return [
            'total_students' => (int) $totalStudents,
            'total_teachers' => (int) $totalTeachers,
            'total_filieres' => (int) $totalFilieres,
            'total_groupes' => (int) $totalGroupes,
            'active_modules' => (int) $activeModules,
        ];
    }
}

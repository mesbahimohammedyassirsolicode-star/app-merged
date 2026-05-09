<?php

namespace App\Services;

use App\Models\Note;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AiAssistantService
{
    public function __construct(
        private IntentParserService $intentParserService,
        private AnalyticsService $analyticsService
    ) {}

    public function handle(User $user, string $query): array
    {
        $this->validateQuerySafety($query);

        $parsed = $this->intentParserService->parse($query);
        $intent = $parsed['intent'];
        $filters = $parsed['filters'] ?? [];
        $cacheKey = 'ai_assistant_'.md5($user->id.'|'.$user->role.'|'.$intent.'|'.json_encode($filters).'|'.mb_strtolower(trim($query)));

        return Cache::remember($cacheKey, 120, function () use ($user, $intent, $filters, $parsed) {
            $response = match ($intent) {
                'students_at_risk' => $this->studentsAtRisk($user, $intent, $filters),
                'top_students' => $this->topStudents($user, $intent),
                'attendance_report' => $this->attendanceReport($user, $intent, $filters),
                'grades_by_module' => $this->gradesByModule($user, $intent),
                'average_performance' => $this->averagePerformance($user, $intent, $filters),
                default => $this->averagePerformance($user, $intent, $filters),
            };

            $response['meta'] = [
                'intent_source' => $parsed['source'] ?? 'rule',
                'applied_filters' => $filters,
            ];

            return $response;
        });
    }

    private function validateQuerySafety(string $query): void
    {
        if (preg_match('/(\b(select|drop|delete|insert|update|union|truncate)\b|;|--|\*\/|\/\*)/i', $query)) {
            throw ValidationException::withMessages([
                'query' => ['Unsupported query pattern detected. Please use a natural-language analytics question.'],
            ]);
        }
    }

    private function scope(User $user): array
    {
        if (in_array($user->role, ['admin', 'directeur', 'secretariat'], true)) {
            return [
                'student_ids' => DB::table('stagiaires')->pluck('user_id')->filter()->values(),
                'group_ids' => DB::table('groupes')->pluck('id')->values(),
                'module_ids' => DB::table('modules')->pluck('id')->values(),
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
                'group_ids' => $groupIds,
                'module_ids' => $rows->pluck('module_id')->unique()->values(),
            ];
        }

        if ($user->role === 'parent') {
            $parent = $user->parent;
            $stagiaires = $parent ? $parent->stagiaires()->get(['stagiaires.id', 'stagiaires.user_id', 'stagiaires.groupe_id']) : collect();
            $groupIds = $stagiaires->pluck('groupe_id')->filter()->unique()->values();
            $moduleIds = DB::table('groupe_module')
                ->whereIn('groupe_id', $groupIds)
                ->pluck('module_id')
                ->unique()
                ->values();

            return [
                'student_ids' => $stagiaires->pluck('user_id')->filter()->values(),
                'group_ids' => $groupIds,
                'module_ids' => $moduleIds,
            ];
        }

        $student = $user->stagiaire;
        $groupId = $student?->groupe_id;
        $moduleIds = $groupId
            ? DB::table('groupe_module')->where('groupe_id', $groupId)->pluck('module_id')->unique()->values()
            : collect();

        return [
            'student_ids' => collect([$student?->user_id])->filter()->values(),
            'group_ids' => collect([$groupId])->filter()->values(),
            'module_ids' => $moduleIds,
        ];
    }

    private function studentsAtRisk(User $user, string $intent, array $filters): array
    {
        $overview = $this->analyticsService->getOverview($user, $filters !== [] ? $filters : [
            'date_from' => now()->startOfMonth()->toDateString(),
            'date_to' => now()->endOfMonth()->toDateString(),
        ]);
        $data = $overview['ai']['at_risk_students'] ?? [];
        $highRiskCount = collect($data)->where('risk_level', 'high')->count();

        return [
            'intent' => $intent,
            'data' => array_slice($data, 0, 20),
            'chart' => [
                'type' => 'bar',
                'labels' => collect($data)->take(8)->pluck('student_name')->values()->all(),
                'data' => collect($data)->take(8)->pluck('risk_score')->values()->all(),
            ],
            'summary' => $highRiskCount > 0
                ? $highRiskCount.' students are at high risk this month.'
                : count($data).' students are at moderate risk this month.',
            'insights' => [
                'Risk combines grade trend and attendance consistency.',
                'Current scope is automatically filtered by your role permissions.',
            ],
            'recommendations' => $overview['ai']['recommendations'] ?? ['Schedule focused remediation sessions.'],
        ];
    }

    private function averagePerformance(User $user, string $intent, array $filters): array
    {
        $overview = $this->analyticsService->getOverview($user, $filters !== [] ? $filters : [
            'date_from' => now()->startOfMonth()->toDateString(),
            'date_to' => now()->endOfMonth()->toDateString(),
        ]);
        $kpis = $overview['kpis'];

        return [
            'intent' => $intent,
            'data' => $kpis,
            'chart' => [
                'type' => 'bar',
                'labels' => ['Attendance Rate', 'Average Grade'],
                'data' => [(float) $kpis['attendance_rate'], (float) $kpis['average_grade']],
            ],
            'summary' => 'Average performance this month is '.$kpis['average_grade'].'/20 with attendance at '.$kpis['attendance_rate'].'%.',
            'insights' => [
                'Attendance and grades are positively correlated in current dataset.',
                $kpis['average_grade'] < 10 ? 'Average grade is below pass threshold.' : 'Average grade is above pass threshold.',
            ],
            'recommendations' => [
                $kpis['attendance_rate'] < 80 ? 'Launch attendance recovery plan.' : 'Maintain attendance discipline.',
                $kpis['average_grade'] < 10 ? 'Assign remedial activities on weak modules.' : 'Offer advanced practice modules.',
            ],
        ];
    }

    private function topStudents(User $user, string $intent): array
    {
        $scope = $this->scope($user);
        $rows = Note::query()
            ->join('stagiaires', 'stagiaires.id', '=', 'notes.stagiaire_id')
            ->join('users', 'users.id', '=', 'stagiaires.user_id')
            ->when($scope['student_ids']->isNotEmpty(), fn ($q) => $q->whereIn('stagiaires.user_id', $scope['student_ids']->all()))
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

        return [
            'intent' => $intent,
            'data' => $rows,
            'chart' => [
                'type' => 'bar',
                'labels' => collect($rows)->pluck('student_name')->values()->all(),
                'data' => collect($rows)->pluck('avg_grade')->values()->all(),
            ],
            'summary' => count($rows).' top students were identified in your scope.',
            'insights' => [
                'Top ranking is based on average grade across available evaluations.',
                'Results are limited to top 10 for readability and performance.',
            ],
            'recommendations' => [
                'Use top students as peer mentors for struggling groups.',
                'Track consistency monthly, not only peak scores.',
            ],
        ];
    }

    private function attendanceReport(User $user, string $intent, array $filters): array
    {
        $overview = $this->analyticsService->getOverview($user, $filters !== [] ? $filters : [
            'date_from' => now()->subMonths(5)->startOfMonth()->toDateString(),
            'date_to' => now()->endOfMonth()->toDateString(),
        ]);
        $timeline = $overview['charts']['attendance_trends'] ?? [];
        $global = $overview['kpis']['attendance_rate'] ?? 0;

        return [
            'intent' => $intent,
            'data' => $timeline,
            'chart' => [
                'type' => 'line',
                'labels' => collect($timeline)->pluck('period')->values()->all(),
                'data' => collect($timeline)->pluck('attendance_rate')->values()->all(),
            ],
            'summary' => 'Global attendance rate is '.$global.'% over the last 6 months.',
            'insights' => [
                'Attendance trend shows period-by-period stability and drops.',
                'Absence counts can be used to trigger early interventions.',
            ],
            'recommendations' => [
                'Contact learners with repeated absence patterns early.',
                'Align attendance alerts with module difficulty peaks.',
            ],
        ];
    }

    private function gradesByModule(User $user, string $intent): array
    {
        $scope = $this->scope($user);
        $rows = Note::query()
            ->join('evaluations', 'evaluations.id', '=', 'notes.evaluation_id')
            ->join('modules', 'modules.id', '=', 'evaluations.module_id')
            ->join('stagiaires', 'stagiaires.id', '=', 'notes.stagiaire_id')
            ->when($scope['student_ids']->isNotEmpty(), fn ($q) => $q->whereIn('stagiaires.user_id', $scope['student_ids']->all()))
            ->when($scope['module_ids']->isNotEmpty(), fn ($q) => $q->whereIn('modules.id', $scope['module_ids']->all()))
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

        $lowest = collect($rows)->sortBy('avg_grade')->take(3)->values()->all();

        return [
            'intent' => $intent,
            'data' => $rows,
            'chart' => [
                'type' => 'bar',
                'labels' => collect($rows)->take(12)->pluck('module_code')->values()->all(),
                'data' => collect($rows)->take(12)->pluck('avg_grade')->values()->all(),
            ],
            'summary' => 'Grades by module calculated for '.count($rows).' modules.',
            'insights' => [
                'Module averages indicate where learners perform best and worst.',
                count($lowest) > 0 ? 'Lowest-performing modules require targeted support.' : 'No module trends available yet.',
            ],
            'recommendations' => [
                'Prioritize remediation for lowest-performing modules.',
                'Review evaluation design for modules with unstable results.',
            ],
        ];
    }
}

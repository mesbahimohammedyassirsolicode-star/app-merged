<?php

namespace App\Strategies\Dashboard;

use App\Models\AnneeScolaire;
use App\Models\Attendance;
use App\Models\Note;
use App\Models\Stagiaire;
use App\Models\User;
use App\Services\AttendanceRiskService;

class ParentStrategy implements DashboardStrategyInterface
{
    use DashboardAnalyticsTrait;

    public function __construct(
        private AttendanceRiskService $attendanceRiskService
    ) {}

    public function getDashboardData(User $user): array
    {
        $parent = $user->parent;
        if (! $parent) {
            return [
                'message' => 'Profil parent non trouve.',
                'children' => [],
                'alerts' => [],
                'attendance' => ['child_overview' => []],
                'quick_actions' => [],
            ];
        }

        $annee = AnneeScolaire::orderByDesc('id')->first();
        $anneeId = $annee?->id;

        $childrenCollection = $parent->children()
            ->with(['user:id,name', 'filiere:id,code,name,label', 'groupe:id,name,label'])
            ->get();

        $childrenIds = $childrenCollection->pluck('id');
        $allLatestNotes = Note::whereIn('stagiaire_id', $childrenIds)
            ->with('evaluation.module')
            ->latest()
            ->get()
            ->groupBy('stagiaire_id');

        $children = $childrenCollection
            ->map(function (Stagiaire $s) use ($anneeId, $allLatestNotes) {
                $attendancePercent = null;
                $isRisk = false;
                if ($anneeId) {
                    try {
                        $summary = $this->attendanceRiskService->summaryForStagiaire($s, $anneeId);
                        $attendancePercent = $summary['global_rate_percent'];
                        $isRisk = $summary['is_risk'];
                    } catch (\Throwable $e) {
                    }
                }

                $latestNotes = collect($allLatestNotes->get($s->id, collect()))
                    ->take(5)
                    ->map(fn (Note $n) => [
                        'evaluation' => $n->evaluation?->item_label ?? $n->evaluation?->type ?? 'Note',
                        'module' => $n->evaluation?->module?->label,
                        'value' => $n->valeur,
                    ])
                    ->values()
                    ->all();

                return [
                    'id' => $s->id,
                    'name' => $s->user?->name,
                    'filiere' => $s->filiere?->label ?? $s->filiere?->code,
                    'groupe' => $s->groupe?->label,
                    'status' => $s->status,
                    'attendance_percent' => $attendancePercent,
                    'is_risk' => $isRisk,
                    'latest_grades' => $latestNotes,
                ];
            })
            ->values()
            ->all();

        $alerts = array_filter($children, fn ($c) => $c['is_risk']);

        $childAttendanceOverview = $childrenCollection
            ->map(function (Stagiaire $s) {
                $summary = $this->singleWindowSummary(
                    Attendance::query()->where('student_id', $s->user_id),
                    now()->startOfMonth(),
                    now()->endOfMonth()
                );

                return [
                    'child_id' => (int) $s->id,
                    'student_user_id' => (int) $s->user_id,
                    'child_name' => $s->user?->name,
                    'monthly_summary' => $summary,
                    'is_risk' => $summary['attendance_rate_percent'] < 80,
                ];
            })
            ->values()
            ->all();

        $quickActions = [
            ['label' => 'Voir les enfants', 'path' => '/parent/children'],
        ];

        return [
            'children' => $children,
            'alerts' => array_values($alerts),
            'attendance' => [
                'child_overview' => $childAttendanceOverview,
            ],
            'quick_actions' => $quickActions,
        ];
    }
}

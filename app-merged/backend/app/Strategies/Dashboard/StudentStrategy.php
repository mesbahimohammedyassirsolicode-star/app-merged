<?php

namespace App\Strategies\Dashboard;

use App\Models\Attendance;
use App\Models\Filiere;
use App\Models\Module;
use App\Models\Note;
use App\Models\Progression;
use App\Models\User;

class StudentStrategy implements DashboardStrategyInterface
{
    use DashboardAnalyticsTrait;

    public function getDashboardData(User $user): array
    {
        $stagiaire = $user->stagiaire;
        if (! $stagiaire) {
            return $this->emptyStagiairePayload();
        }

        $stagiaire->load(['filiere:id,code,name,label', 'groupes:id,name,label,niveau_id', 'groupe:id,name,label,niveau_id']);

        $filiereId = $stagiaire->getFiliereIdForScope();
        if ($filiereId === null) {
            return $this->emptyStagiairePayload();
        }
        $filiereModel = $stagiaire->filiere ?? Filiere::find($filiereId);
        if (! $filiereModel) {
            return $this->emptyStagiairePayload();
        }

        $groupeIds = $stagiaire->getGroupeIdsInFiliere($filiereId);
        $groupeRel = $stagiaire->groupe ?? $stagiaire->groupes->first();
        $filiereIdOnGroup = $groupeRel?->niveau?->filiere_id ?? null;
        $groupeFiliereMatch = $groupeRel !== null
            && $filiereIdOnGroup !== null
            && (int) $filiereIdOnGroup === $filiereId;
        $groupeModel = $groupeFiliereMatch
            ? $groupeRel
            : $stagiaire->groupes()->whereHas('niveau', fn ($q) => $q->where('filiere_id', $filiereId))->with('niveau.filiere')->first();
        if ($groupeIds->isEmpty() && $groupeModel !== null) {
            $groupeIds = collect([$groupeModel->id]);
        }

        $filiere = [
            'id' => $filiereModel->id,
            'code' => $filiereModel->code ?? '',
            'label' => $filiereModel->label ?? '',
        ];
        $groupe = $groupeModel !== null ? [
            'id' => $groupeModel->id,
            'label' => $groupeModel->label ?? '',
        ] : null;

        $modules = $groupeIds->isEmpty()
            ? collect([])
            : Module::whereIn('niveau_id', function ($query) use ($groupeIds) {
                $query->select('niveau_id')->from('groupes')->whereIn('id', $groupeIds);
            })->get();

        $moduleIds = $modules->pluck('id');
        $progressions = Progression::whereIn('module_id', $moduleIds)
            ->where('groupe_id', $stagiaire->groupe_id)
            ->selectRaw('module_id, status, count(*) as count')
            ->groupBy('module_id', 'status')
            ->get();

        $syllabusProgress = [];
        foreach ($modules as $module) {
            $total = $progressions->where('module_id', $module->id)->sum('count');
            $completed = $progressions->where('module_id', $module->id)->where('status', 'completed')->sum('count');
            $percent = $total > 0 ? round($completed / $total * 100, 1) : 0;
            $syllabusProgress[] = [
                'module' => $module->label,
                'progress_percent' => $percent,
                'completed_count' => (int) $completed,
                'total_count' => (int) $total,
            ];
        }

        $latestGrades = Note::where('stagiaire_id', $stagiaire->id)
            ->whereHas('evaluation.module.niveau', fn ($q) => $q->where('filiere_id', $filiereId))
            ->with('evaluation.module')
            ->latest()
            ->take(10)
            ->get()
            ->map(fn (Note $n) => [
                'evaluation' => $n->evaluation?->item_label ?? $n->evaluation?->type ?? 'Note',
                'module' => $n->evaluation?->module?->label,
                'value' => $n->valeur,
                'date' => $n->created_at?->toDateString(),
            ])
            ->values()
            ->all();

        $attendanceHistory = Attendance::query()
            ->where('student_id', $user->id)
            ->with(['module:id,code,label', 'group:id,label'])
            ->orderByDesc('date')
            ->limit(20)
            ->get()
            ->map(fn (Attendance $a) => [
                'id' => (int) $a->id,
                'date' => $a->date,
                'status' => $a->status,
                'minutes_late' => $a->minutes_late,
                'module' => $a->module ? [
                    'id' => (int) $a->module->id,
                    'code' => $a->module->code,
                    'label' => $a->module->label,
                ] : null,
                'group' => $a->group ? [
                    'id' => (int) $a->group->id,
                    'label' => $a->group->label,
                ] : null,
            ])
            ->values()
            ->all();

        $studentMonthlySummary = $this->singleWindowSummary(
            Attendance::query()->where('student_id', $user->id),
            now()->startOfMonth(),
            now()->endOfMonth()
        );

        $quickActions = [
            ['label' => 'Mon groupe', 'path' => '/group'],
            ['label' => 'Emploi du temps', 'path' => '/timetable'],
            ['label' => 'Ma progression', 'path' => '/progress'],
        ];

        return [
            'filiere' => $filiere,
            'groupe' => $groupe,
            'syllabus_progress' => $syllabusProgress,
            'latest_grades' => $latestGrades,
            'attendance' => [
                'history' => $attendanceHistory,
                'monthly_summary' => $studentMonthlySummary,
                'is_risk' => $studentMonthlySummary['attendance_rate_percent'] < 80,
            ],
            'quick_actions' => $quickActions,
        ];
    }

    private function emptyStagiairePayload(): array
    {
        return [
            'message' => 'Profil stagiaire non trouve ou aucune filiere assignee.',
            'filiere' => null,
            'groupe' => null,
            'syllabus_progress' => [],
            'latest_grades' => [],
            'attendance' => [
                'history' => [],
                'monthly_summary' => $this->singleWindowSummary(
                    Attendance::query()->whereRaw('1 = 0'),
                    now()->startOfMonth(),
                    now()->endOfMonth()
                ),
                'is_risk' => false,
            ],
            'quick_actions' => [
                ['label' => 'Mon groupe', 'path' => '/group'],
                ['label' => 'Emploi du temps', 'path' => '/timetable'],
                ['label' => 'Ma progression', 'path' => '/progress'],
            ],
        ];
    }
}

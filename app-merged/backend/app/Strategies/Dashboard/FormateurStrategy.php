<?php

namespace App\Strategies\Dashboard;

use App\Models\AnneeScolaire;
use App\Models\Attendance;
use App\Models\Seance;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class FormateurStrategy implements DashboardStrategyInterface
{
    public function getDashboardData(User $user): array
    {
        $formateur = $user->formateur;
        if (! $formateur) {
            return [
                'message' => 'Profil formateur non trouve.',
                'todays_sessions' => [],
                'assigned_modules' => [],
                'attendance' => ['pending_today' => [], 'recent_absences' => []],
                'quick_actions' => [],
            ];
        }

        $today = now()->toDateString();

        $todaysSessions = Seance::where('user_id', $user->id)
            ->where('date', $today)
            ->with(['module', 'groupe', 'filiere'])
            ->orderBy('start_time')
            ->get()
            ->map(fn (Seance $s) => [
                'id' => $s->id,
                'module' => $s->module?->label,
                'groupe' => $s->groupe?->label,
                'filiere' => $s->filiere?->code,
                'start_time' => $s->start_time,
                'end_time' => $s->end_time,
            ])
            ->values()
            ->all();

        $academicYearId = (int) (AnneeScolaire::where('is_current', true)->value('id') ?? 0);

        // Primary source: assignments managed from user edit modal (formateur_module_group by user_id).
        $moduleGroupRows = DB::table('formateur_module_group as fmg')
            ->join('modules as m', 'm.id', '=', 'fmg.module_id')
            ->join('groupes as g', 'g.id', '=', 'fmg.groupe_id')
            ->leftJoin('niveaux as n', 'n.id', '=', 'g.niveau_id')
            ->leftJoin('filieres as f', 'f.id', '=', 'n.filiere_id')
            ->where('fmg.user_id', $user->id)
            ->select([
                'm.id as module_id',
                'm.code as module_code',
                DB::raw('COALESCE(m.label, m.name) as module_label'),
                'g.id as group_id',
                DB::raw('COALESCE(g.label, g.name) as group_label'),
                'f.id as filiere_id',
                'f.code as filiere_code',
                'f.label as filiere_label',
            ])
            ->orderBy('m.code')
            ->orderBy('g.label')
            ->get();

        if ($moduleGroupRows->isNotEmpty()) {
            $assignedModules = $moduleGroupRows
                ->groupBy('module_id')
                ->map(function ($rows) {
                    $first = $rows->first();

                    return [
                        'module_id' => (int) $first->module_id,
                        'module_code' => (string) $first->module_code,
                        'module_label' => (string) $first->module_label,
                        'groupes' => $rows
                            ->unique('group_id')
                            ->map(fn ($r) => [
                                'id' => (int) $r->group_id,
                                'label' => (string) $r->group_label,
                                'filiere' => $r->filiere_id ? [
                                    'id' => (int) $r->filiere_id,
                                    'code' => (string) $r->filiere_code,
                                    'label' => (string) $r->filiere_label,
                                ] : null,
                            ])
                            ->values()
                            ->all(),
                    ];
                })
                ->values()
                ->all();
        } else {
            // Fallback source: legacy academic-year assignment model.
            $assignedModules = $academicYearId > 0
                ? $formateur->modules()
                    ->wherePivot('academic_year', $academicYearId)
                    ->with(['groupes' => fn ($q) => $q
                        ->wherePivot('academic_year', $academicYearId)
                        ->with('niveau.filiere')
                        ->select('groupes.id', 'groupes.name', 'groupes.label', 'groupes.niveau_id'),
                    ])
                    ->select('modules.id', 'modules.code', 'modules.name', 'modules.label')
                    ->get()
                    ->map(function ($m) {
                        $groupes = $m->groupes->map(fn ($g) => [
                            'id' => $g->id,
                            'label' => $g->label,
                            'filiere' => $g->niveau?->filiere ? [
                                'id' => $g->niveau->filiere->id,
                                'code' => $g->niveau->filiere->code,
                                'label' => $g->niveau->filiere->label,
                            ] : null,
                        ])->values()->all();

                        return [
                            'module_id' => $m->id,
                            'module_code' => $m->code,
                            'module_label' => $m->label,
                            'groupes' => $groupes,
                        ];
                    })
                    ->values()
                    ->all()
                : [];
        }

        $assignmentPairs = collect($assignedModules)
            ->flatMap(fn ($m) => collect($m['groupes'])->map(fn ($g) => [
                'module_id' => (int) $m['module_id'],
                'module_code' => $m['module_code'],
                'module_label' => $m['module_label'],
                'group_id' => (int) $g['id'],
                'group_label' => $g['label'],
            ]))
            ->values();

        $groupIds = $assignmentPairs->pluck('group_id')->unique()->values();
        $filierePayload = collect($assignedModules)
            ->flatMap(fn ($m) => collect($m['groupes'])->pluck('filiere'))
            ->first(fn ($f) => is_array($f) && isset($f['id']));

        $linkedStagiaires = DB::table('stagiaires as s')
            ->join('users as u', 'u.id', '=', 's.user_id')
            ->when(
                $groupIds->isNotEmpty(),
                fn ($q) => $q->whereIn('s.groupe_id', $groupIds->all()),
                fn ($q) => $q->whereRaw('1 = 0')
            )
            ->select('s.id', 'u.id as user_id', 'u.name', 's.groupe_id')
            ->orderBy('u.name')
            ->limit(20)
            ->get()
            ->map(fn ($row) => [
                'id' => (int) $row->id,
                'user_id' => (int) $row->user_id,
                'name' => (string) $row->name,
                'groupe_id' => (int) $row->groupe_id,
            ])
            ->values()
            ->all();

        $pendingToday = $assignmentPairs
            ->filter(function (array $pair) use ($today): bool {
                return ! Attendance::query()
                    ->where('date', $today)
                    ->where('module_id', $pair['module_id'])
                    ->where('group_id', $pair['group_id'])
                    ->exists();
            })
            ->map(fn (array $pair) => [
                'module_id' => $pair['module_id'],
                'module_code' => $pair['module_code'],
                'module_label' => $pair['module_label'],
                'group_id' => $pair['group_id'],
                'group_label' => $pair['group_label'],
                'date' => $today,
            ])
            ->values()
            ->all();

        $recentAbsences = Attendance::query()
            ->join('users as students', 'students.id', '=', 'attendances.student_id')
            ->join('modules', 'modules.id', '=', 'attendances.module_id')
            ->join('groupes', 'groupes.id', '=', 'attendances.group_id')
            ->where('attendances.status', 'absent')
            ->whereDate('attendances.date', '>=', now()->subDays(14)->toDateString())
            ->where('attendances.teacher_id', $user->id)
            ->orderByDesc('attendances.date')
            ->limit(20)
            ->get([
                'attendances.id',
                'attendances.date',
                'students.id as student_id',
                'students.name as student_name',
                'modules.id as module_id',
                'modules.code as module_code',
                DB::raw('COALESCE(modules.label, modules.name) as module_label'),
                'groupes.id as group_id',
                DB::raw('COALESCE(groupes.label, groupes.name) as group_label'),
            ])
            ->map(fn ($row) => [
                'id' => (int) $row->id,
                'date' => $row->date,
                'student_id' => (int) $row->student_id,
                'student_name' => $row->student_name,
                'module_id' => (int) $row->module_id,
                'module_code' => $row->module_code,
                'module_label' => $row->module_label,
                'group_id' => (int) $row->group_id,
                'group_label' => $row->group_label,
            ])
            ->values()
            ->all();

        $quickActions = [
            ['label' => 'Marquer les presences', 'path' => '/attendance'],
            ['label' => 'Saisir les notes', 'path' => '/evaluations'],
        ];

        return [
            'todays_sessions' => $todaysSessions,
            'assigned_modules' => $assignedModules,
            'teaching_scope' => [
                'filiere' => $filierePayload ?: null,
                'modules_count' => count($assignedModules),
                'groups_count' => $groupIds->count(),
                'stagiaires_count' => count($linkedStagiaires),
                'stagiaires' => $linkedStagiaires,
            ],
            'attendance' => [
                'pending_today' => $pendingToday,
                'recent_absences' => $recentAbsences,
            ],
            'quick_actions' => $quickActions,
        ];
    }
}

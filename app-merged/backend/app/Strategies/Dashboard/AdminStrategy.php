<?php

namespace App\Strategies\Dashboard;

use App\Models\Attendance;
use App\Models\Filiere;
use App\Models\Formateur;
use App\Models\Groupe;
use App\Models\Stagiaire;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class AdminStrategy implements DashboardStrategyInterface
{
    use DashboardAnalyticsTrait;

    public function getDashboardData(User $user): array
    {
        $stats = [
            'total_students' => Stagiaire::where('status', 'actif')->count(),
            'total_teachers' => Formateur::count(),
            'total_filieres' => Filiere::count(),
            'total_groupes' => Groupe::count(),
        ];

        $studentsPerFiliere = Filiere::orderBy('code')
            ->get()
            ->map(function (Filiere $f) {
                $groupeIds = $f->groupes()->pluck('groupes.id');
                $value = $groupeIds->isEmpty()
                    ? 0
                    : (int) DB::table('groupe_stagiaire')
                        ->whereIn('groupe_id', $groupeIds)
                        ->selectRaw('COUNT(DISTINCT stagiaire_id) as c')
                        ->value('c');

                return ['name' => $f->code, 'value' => $value];
            })
            ->values()
            ->all();

        $absenceRateByGroupModule = Attendance::query()
            ->join('groupes', 'groupes.id', '=', 'attendances.group_id')
            ->join('modules', 'modules.id', '=', 'attendances.module_id')
            ->selectRaw('
                attendances.group_id,
                COALESCE(groupes.label, groupes.name) as group_label,
                attendances.module_id,
                modules.code as module_code,
                COALESCE(modules.label, modules.name) as module_label,
                COUNT(*) as total_count,
                SUM(CASE WHEN attendances.status = ? THEN 1 ELSE 0 END) as absent_count,
                ROUND(
                    (SUM(CASE WHEN attendances.status = ? THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0)) * 100,
                    2
                ) as absence_rate_percent
            ', ['absent', 'absent'])
            ->groupBy('attendances.group_id', 'groupes.label', 'groupes.name', 'attendances.module_id', 'modules.code', 'modules.label', 'modules.name')
            ->orderByDesc('absence_rate_percent')
            ->orderByDesc('total_count')
            ->limit(12)
            ->get()
            ->map(fn ($row) => [
                'group_id' => (int) $row->group_id,
                'group_label' => $row->group_label,
                'module_id' => (int) $row->module_id,
                'module_code' => $row->module_code,
                'module_label' => $row->module_label,
                'total_count' => (int) $row->total_count,
                'absent_count' => (int) $row->absent_count,
                'absence_rate_percent' => (float) $row->absence_rate_percent,
                'is_risk' => (float) $row->absence_rate_percent >= 20,
            ])
            ->values()
            ->all();

        $monthlySummary = $this->monthlyAttendanceSummary(Attendance::query(), 6);

        $quickActions = [
            ['label' => 'Gerer les utilisateurs', 'path' => '/users'],
            ['label' => 'Filieres et groupes', 'path' => '/academic/filieres'],
            ['label' => 'Groupes', 'path' => '/groups'],
        ];

        return [
            'stats' => $stats,
            'charts' => [
                'students_per_filiere' => $studentsPerFiliere,
            ],
            'attendance' => [
                'absence_rate_by_group_module' => $absenceRateByGroupModule,
                'monthly_summary' => $monthlySummary,
            ],
            'quick_actions' => $quickActions,
        ];
    }
}

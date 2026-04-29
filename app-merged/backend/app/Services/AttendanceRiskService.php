<?php

namespace App\Services;

use App\Models\AnneeScolaire;
use App\Models\Attendance;
use App\Models\Groupe;
use App\Models\Stagiaire;
use Illuminate\Support\Facades\DB;

class AttendanceRiskService
{
    public static function thresholdPercent(): int
    {
        return (int) config('gims.attendance_threshold_percent', 80);
    }

    /**
     * @return array<int, array{stagiaire_id:int,stagiaire:Stagiaire,by_affectation:array,global_rate_percent:float,is_risk:bool,can_sit_exam:bool}>
     */
    public function summaryForGroupe(Groupe $groupe, ?int $anneeScolaireId = null): array
    {
        $stagiaires = $groupe->stagiaires()->with('user')->get();
        // Get modules assigned to this group via module_groupe pivot
        $modules = DB::table('module_groupe')
            ->where('groupe_id', $groupe->id)
            ->join('modules', 'modules.id', '=', 'module_groupe.module_id')
            ->select('modules.*')
            ->get();

        $result = [];
        foreach ($stagiaires as $stagiaire) {
            $byModule = [];
            $totalPresent = 0;
            $totalRows = 0;

            foreach ($modules as $module) {
                $stats = $this->rateForStagiaireAndModule((int) $stagiaire->id, (int) $module->id, (int) $groupe->id);
                $byModule[] = [
                    'module_id' => $module->id,
                    'module' => $module->name,
                    'rate_percent' => $stats['rate_percent'],
                    'present_count' => $stats['present_count'],
                    'total_count' => $stats['total_count'],
                    'is_risk' => $stats['rate_percent'] < self::thresholdPercent(),
                ];

                $totalPresent += $stats['present_count'];
                $totalRows += $stats['total_count'];
            }

            $globalRate = $totalRows > 0 ? round($totalPresent / $totalRows * 100, 2) : 0.0;
            $isRisk = $globalRate < self::thresholdPercent();

            $result[] = [
                'stagiaire_id' => (int) $stagiaire->id,
                'stagiaire' => $stagiaire,
                'by_module' => $byModule,
                'global_rate_percent' => $globalRate,
                'is_risk' => $isRisk,
                'can_sit_exam' => ! $isRisk,
            ];
        }

        return $result;
    }

    public function rateForStagiaireAndModule(int $stagiaireId, int $moduleId, int $groupId): array
    {
        $stagiaire = Stagiaire::query()->find($stagiaireId);

        if (! $stagiaire || ! $stagiaire->user_id) {
            return ['present_count' => 0, 'total_count' => 0, 'rate_percent' => 0.0];
        }

        $query = Attendance::query()
            ->where('student_id', (int) $stagiaire->user_id)
            ->where('module_id', $moduleId)
            ->where('group_id', $groupId);

        $totalCount = (clone $query)->count();
        if ($totalCount === 0) {
            return ['present_count' => 0, 'total_count' => 0, 'rate_percent' => 0.0];
        }

        $presentCount = (clone $query)->whereIn('status', ['present', 'late'])->count();
        $ratePercent = round($presentCount / $totalCount * 100, 2);

        return [
            'present_count' => $presentCount,
            'total_count' => $totalCount,
            'rate_percent' => $ratePercent,
        ];
    }

    public function summaryForStagiaire(Stagiaire $stagiaire, int $anneeScolaireId): array
    {
        $modules = DB::table('module_groupe')
            ->whereIn('groupe_id', $groupeIds)
            ->join('modules', 'modules.id', '=', 'module_groupe.module_id')
            ->select('modules.*', 'module_groupe.groupe_id')
            ->get();

        $byModule = [];
        $totalPresent = 0;
        $totalRows = 0;
        foreach ($modules as $module) {
            $stats = $this->rateForStagiaireAndModule((int) $stagiaire->id, (int) $module->id, (int) $module->groupe_id);
            $byModule[] = [
                'module_id' => $module->id,
                'module' => $module->name,
                'rate_percent' => $stats['rate_percent'],
                'present_count' => $stats['present_count'],
                'total_count' => $stats['total_count'],
                'is_risk' => $stats['rate_percent'] < self::thresholdPercent(),
            ];

            $totalPresent += $stats['present_count'];
            $totalRows += $stats['total_count'];
        }

        $globalRate = $totalRows > 0 ? round($totalPresent / $totalRows * 100, 2) : 0.0;
        $isRisk = $globalRate < self::thresholdPercent();

        return [
            'stagiaire_id' => (int) $stagiaire->id,
            'stagiaire' => $stagiaire->load('user'),
            'by_module' => $byModule,
            'global_rate_percent' => $globalRate,
            'is_risk' => $isRisk,
            'can_sit_exam' => ! $isRisk,
            'threshold_percent' => self::thresholdPercent(),
        ];
    }

    /**
     * @return array{0:?string,1:?string}
     */
    private function resolveAcademicYearWindow(?int $anneeId, ?AnneeScolaire $loaded): array
    {
        $annee = $loaded ?? ($anneeId ? AnneeScolaire::query()->find($anneeId) : null);
        if (! $annee || ! $annee->start_date || ! $annee->end_date) {
            return [null, null];
        }

        return [
            (string) $annee->start_date,
            (string) $annee->end_date,
        ];
    }
}

<?php

namespace App\Services;

use App\Models\Evaluation;
use App\Models\Groupe;
use App\Models\Module;
use App\Models\Stagiaire;

/**
 * Module-grade summary: weighted average per stagiaire per affectation (module).
 * Evaluations have coefficient; note valeur is out of max_points.
 * Average = sum(valeur / max_points * coefficient) / sum(coefficient) * 20 (scale to /20).
 */
class GradesSummaryService
{
    /**
     * For each stagiaire in the groupe, compute module average (weighted by evaluation coefficient).
     *
     * @return array<int, array{stagiaire_id, Stagiaire, evaluations: array, module_average, module_average_over_20}>
     */
    public function summaryForModuleGroup(Module $module, Groupe $groupe): array
    {
        $stagiaireIds = $groupe->stagiaires()->pluck('stagiaires.id')->toArray();
        $evaluations = Evaluation::where('module_id', $module->id)
            ->where('groupe_id', $groupe->id)
            ->get();
        $totalCoeff = $evaluations->sum('coefficient');
        if ($totalCoeff <= 0) {
            $totalCoeff = 1;
        }

        $result = [];
        foreach ($stagiaireIds as $sid) {
            $stagiaire = Stagiaire::with('user')->find($sid);
            if (! $stagiaire) {
                continue;
            }
            $evalRows = [];
            $weightedSum = 0;
            $coeffSum = 0;
            foreach ($evaluations as $ev) {
                $note = $ev->notes()->where('stagiaire_id', $sid)->first();
                $valeur = $note ? (float) $note->valeur : 0;
                $max = (float) $ev->max_points ?: 20;
                $coef = (float) $ev->coefficient ?: 1;
                $normalized = $max > 0 ? ($valeur / $max) * 20 : 0; // scale to /20
                $weightedSum += $normalized * $coef;
                $coeffSum += $coef;
                $evalRows[] = [
                    'evaluation_id' => $ev->id,
                    'type' => $ev->type,
                    'item_label' => $ev->item_label,
                    'valeur' => $valeur,
                    'max_points' => $ev->max_points,
                    'coefficient' => $ev->coefficient,
                    'normalized_over_20' => round($normalized, 2),
                ];
            }
            $moduleAverage = $coeffSum > 0 ? round($weightedSum / $coeffSum, 2) : 0;

            $result[] = [
                'stagiaire_id' => $sid,
                'stagiaire' => $stagiaire,
                'evaluations' => $evalRows,
                'module_average' => $moduleAverage,
                'module_average_over_20' => $moduleAverage,
            ];
        }

        return $result;
    }

    /**
     * One stagiaire's grades for one module/group.
     */
    public function summaryForStagiaireAndModule(Stagiaire $stagiaire, Module $module, Groupe $groupe): array
    {
        $evaluations = Evaluation::where('module_id', $module->id)
            ->where('groupe_id', $groupe->id)
            ->get();
        $evalRows = [];
        $weightedSum = 0;
        $coeffSum = 0;
        foreach ($evaluations as $ev) {
            $note = $ev->notes()->where('stagiaire_id', $stagiaire->id)->first();
            $valeur = $note ? (float) $note->valeur : 0;
            $max = (float) $ev->max_points ?: 20;
            $coef = (float) $ev->coefficient ?: 1;
            $normalized = $max > 0 ? ($valeur / $max) * 20 : 0;
            $weightedSum += $normalized * $coef;
            $coeffSum += $coef;
            $evalRows[] = [
                'evaluation_id' => $ev->id,
                'type' => $ev->type,
                'item_label' => $ev->item_label,
                'valeur' => $valeur,
                'max_points' => $ev->max_points,
                'coefficient' => $ev->coefficient,
                'normalized_over_20' => round($normalized, 2),
            ];
        }
        $moduleAverage = $coeffSum > 0 ? round($weightedSum / $coeffSum, 2) : 0;

        return [
            'stagiaire' => $stagiaire->load('user'),
            'module' => $module,
            'groupe' => $groupe,
            'evaluations' => $evalRows,
            'module_average_over_20' => $moduleAverage,
        ];
    }
}

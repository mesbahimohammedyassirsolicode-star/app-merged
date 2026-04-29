<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Eligibility: niveau_scolaire (diplôme obtenu) must meet minimum for
 * type de formation (formation visée).
 *
 * Niveau scolaire = diplôme obtenu avant inscription (Collège, Bac, Bac+2, Bac+3, Master).
 * Type de formation = formation visée (Q, T, TS, Bachelor, Master).
 *
 * - Qualification (Q): minimum Collège
 * - Technicien (T): minimum Bac
 * - Technicien Spécialisé (TS): minimum Bac
 * - Bachelor: minimum Bac+2
 * - Master: minimum Bac+3
 */
class OfpptEligibility implements ValidationRule
{
    protected static array $niveauScolaireOrder = [
        'COLLEGE' => 0,
        'BAC' => 1,
        'BAC+2' => 2,
        'BAC+3' => 3,
        'MASTER' => 4,
    ];

    protected static array $minNiveauScolaire = [
        'Q' => 'COLLEGE',
        'T' => 'BAC',
        'TS' => 'BAC',
        'BACHELOR' => 'BAC+2',
        'MASTER' => 'BAC+3',
    ];

    public function __construct(protected ?string $niveauFormation = null) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $formation = $this->niveauFormation;
        $scolaire = is_string($value) ? trim($value) : null;

        if (! $formation || ! $scolaire) {
            return;
        }

        $min = self::$minNiveauScolaire[$formation] ?? null;
        if (! $min) {
            return;
        }

        $scolaireRank = self::$niveauScolaireOrder[$scolaire] ?? -1;
        $minRank = self::$niveauScolaireOrder[$min] ?? 0;

        if ($scolaireRank < $minRank) {
            $formationLabels = [
                'Q' => 'Qualification',
                'T' => 'Technicien',
                'TS' => 'Technicien Spécialisé',
                'BACHELOR' => 'Bachelor',
                'MASTER' => 'Master',
            ];
            $minLabels = [
                'COLLEGE' => 'Collège',
                'BAC' => 'Baccalauréat',
                'BAC+2' => 'Bac+2',
                'BAC+3' => 'Bac+3',
            ];
            $formationLabel = $formationLabels[$formation] ?? $formation;
            $minLabel = $minLabels[$min] ?? $min;
            $fail("Pour la formation {$formationLabel}, le niveau scolaire minimum requis est {$minLabel}.");
        }
    }
}

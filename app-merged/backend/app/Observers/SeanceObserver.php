<?php

namespace App\Observers;

use App\Models\Seance;

class SeanceObserver
{
    public function saving(Seance $seance): void
    {
        if ($seance->affectation_id && (is_null($seance->filiere_id) || is_null($seance->groupe_id))) {
            $affectation = $seance->affectation ?? $seance->affectation()->with('groupe')->first();
            if ($affectation?->groupe) {
                $seance->filiere_id = $seance->filiere_id ?? $affectation->groupe->filiere_id;
                $seance->groupe_id = $seance->groupe_id ?? $affectation->groupe_id;
            }
        }
    }
}

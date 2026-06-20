<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Paiement;
use App\Models\Eleve;
use App\Models\School;

class PaiementSeeder extends Seeder
{
    public function run(): void
    {
        $school = School::first();
        $eleves = Eleve::all();

        foreach ($eleves->random(20) as $eleve) {
            Paiement::create([
                'eleve_id' => $eleve->id,
                'mois' => 'Septembre 2024',
                'montant' => 1500.00,
                'mode_paiement' => 'Espèces',
                'date_paiement' => now()->subDays(rand(1, 30)),
                'statut' => 'payé',
                'school_id' => $school->id
            ]);
        }
    }
}

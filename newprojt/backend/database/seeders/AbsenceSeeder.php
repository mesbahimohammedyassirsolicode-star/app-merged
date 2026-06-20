<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Absence;
use App\Models\Eleve;

class AbsenceSeeder extends Seeder
{
    public function run(): void
    {
        $eleves = Eleve::all();

        foreach ($eleves->random(15) as $eleve) {
            Absence::create([
                'eleve_id' => $eleve->id,
                'classe_id' => $eleve->classe_id,
                'date' => now()->subDays(rand(1, 10)),
                'seance' => 'Matin',
                'motif' => 'Maladie',
                'justifiee' => rand(0, 1)
            ]);
        }
    }
}

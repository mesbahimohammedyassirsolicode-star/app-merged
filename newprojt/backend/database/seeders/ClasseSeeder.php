<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Classe;
use App\Models\Niveau;
use App\Models\Enseignant;
use App\Models\School;

class ClasseSeeder extends Seeder
{
    public function run(): void
    {
        $school = School::first();
        $niveaux = Niveau::all();
        $enseignants = Enseignant::all();

        foreach ($niveaux as $niveau) {
            // Create 2 classes per level
            for ($i = 1; $i <= 2; $i++) {
                Classe::create([
                    'name' => $niveau->name . ' - Section ' . chr(64 + $i),
                    'niveau_id' => $niveau->id,
                    'enseignant_principal_id' => $enseignants->random()->id,
                    'capacite_max' => 30,
                    'school_id' => $school->id
                ]);
            }
        }
    }
}

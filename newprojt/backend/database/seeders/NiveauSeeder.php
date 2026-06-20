<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Niveau;
use App\Models\School;

class NiveauSeeder extends Seeder
{
    public function run(): void
    {
        $school = School::first();

        $niveaux = [
            ['name' => 'Primaire 1', 'description' => 'Première année du cycle primaire'],
            ['name' => 'Primaire 2', 'description' => 'Deuxième année du cycle primaire'],
            ['name' => 'Primaire 3', 'description' => 'Troisième année du cycle primaire'],
            ['name' => 'Collège 1', 'description' => 'Première année du cycle collège'],
            ['name' => 'Collège 2', 'description' => 'Deuxième année du cycle collège'],
        ];

        foreach ($niveaux as $niveau) {
            Niveau::create(array_merge($niveau, ['school_id' => $school->id]));
        }
    }
}

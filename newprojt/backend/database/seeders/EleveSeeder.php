<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Eleve;
use App\Models\Classe;
use App\Models\School;
use Faker\Factory as Faker;

class EleveSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create('fr_FR');
        $school = School::first();
        $classes = Classe::all();

        for ($i = 0; $i < 50; $i++) {
            Eleve::create([
                'nom' => $faker->lastName,
                'prenom' => $faker->firstName,
                'code_massar' => $faker->unique()->bothify('?#########'),
                'date_naissance' => $faker->date('Y-m-d', '-10 years'),
                'adresse' => $faker->address,
                'classe_id' => $classes->random()->id,
                'school_id' => $school->id,
                'statut' => 'actif'
            ]);
        }
    }
}

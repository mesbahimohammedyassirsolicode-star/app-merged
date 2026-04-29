<?php

namespace Database\Factories;

use App\Models\Filiere;
use App\Models\Groupe;
use App\Models\Stagiaire;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Stagiaire>
 */
class StagiaireFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'filiere_id' => Filiere::factory(),
            'groupe_id' => Groupe::factory(),
            'cin' => $this->faker->unique()->lexify('??????'),
            'cef_number' => $this->faker->unique()->numerify('#########'),
            'date_naissance' => $this->faker->date(),
            'niveau_scolaire' => 'BAC',
            'niveau_formation' => 'TS',
            'status' => 'actif',
        ];
    }
}

<?php

namespace Database\Factories;

use App\Models\Filiere;
use App\Models\Groupe;
use App\Models\Niveau;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Groupe>
 */
class GroupeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $label = $this->faker->unique()->bothify('GRP-###');

        return [
            'niveau_id' => Niveau::factory(),
            'filiere_id' => Filiere::factory(),
            'name' => $label,
            'label' => $label,
            'year_level' => $this->faker->randomElement([1, 2]),
            'capacity' => 30,
        ];
    }
}

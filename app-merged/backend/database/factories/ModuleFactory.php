<?php

namespace Database\Factories;

use App\Models\Filiere;
use App\Models\Module;
use App\Models\Niveau;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Module>
 */
class ModuleFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $label = rtrim($this->faker->sentence(2), '.');

        return [
            'niveau_id' => Niveau::factory(),
            'filiere_id' => Filiere::factory(),
            'code' => $this->faker->unique()->lexify('MOD-???'),
            'name' => $label,
            'label' => $label,
            'coefficient' => $this->faker->numberBetween(1, 4),
            'masse_horaire' => $this->faker->numberBetween(40, 120),
            'semester' => 'S1',
        ];
    }
}

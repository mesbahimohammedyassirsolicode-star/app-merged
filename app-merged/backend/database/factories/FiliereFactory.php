<?php

namespace Database\Factories;

use App\Models\Filiere;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Filiere>
 */
class FiliereFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $label = rtrim($this->faker->sentence(3), '.');

        return [
            'niveau_id' => null,
            'code' => $this->faker->unique()->lexify('???'),
            'name' => $label,
            'label' => $label,
            'type' => 'TS',
            'required_level' => 'BAC',
            'duration_years' => 2,
        ];
    }
}

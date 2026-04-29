<?php

namespace Database\Factories;

use App\Models\Formateur;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Formateur>
 */
class FormateurFactory extends Factory
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
            'matricule' => $this->faker->unique()->numerify('MAT-####'),
            'specialty' => $this->faker->word(),
            'type' => 'permanent',
        ];
    }
}

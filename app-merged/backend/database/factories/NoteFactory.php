<?php

namespace Database\Factories;

use App\Models\Evaluation;
use App\Models\Note;
use App\Models\Stagiaire;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Note>
 */
class NoteFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'evaluation_id' => Evaluation::factory(),
            'stagiaire_id' => Stagiaire::factory(),
            'valeur' => $this->faker->numberBetween(0, 20),
            'observation' => $this->faker->sentence(),
        ];
    }
}

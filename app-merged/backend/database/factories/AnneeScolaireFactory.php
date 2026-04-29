<?php

namespace Database\Factories;

use App\Models\AnneeScolaire;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AnneeScolaire>
 */
class AnneeScolaireFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $start = (int) $this->faker->numberBetween(2020, 2025);

        return [
            'year_start' => $start,
            'year_end' => $start + 1,
            'label' => $start.'-'.($start + 1),
            'is_current' => false,
            'start_date' => $start.'-09-01',
            'end_date' => ($start + 1).'-06-30',
        ];
    }
}

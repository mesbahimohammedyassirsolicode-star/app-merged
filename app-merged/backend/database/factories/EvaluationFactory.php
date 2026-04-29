<?php

namespace Database\Factories;

use App\Models\Evaluation;
use App\Models\Groupe;
use App\Models\Module;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Evaluation>
 */
class EvaluationFactory extends Factory
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
            'module_id' => Module::factory(),
            'groupe_id' => Groupe::factory(),
            'item_label' => $this->faker->word(),
            'type' => 'cc',
            'max_points' => 20,
            'coefficient' => 1,
            'date' => now(),
        ];
    }
}

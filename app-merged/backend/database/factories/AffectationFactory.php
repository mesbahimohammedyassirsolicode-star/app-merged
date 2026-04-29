<?php

namespace Database\Factories;

use App\Models\Affectation;
use App\Models\AnneeScolaire;
use App\Models\Formateur;
use App\Models\Groupe;
use App\Models\Module;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Affectation>
 */
class AffectationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'formateur_id' => Formateur::factory(),
            'module_id' => Module::factory(),
            'groupe_id' => Groupe::factory(),
            'annee_scolaire_id' => AnneeScolaire::factory(),
        ];
    }
}

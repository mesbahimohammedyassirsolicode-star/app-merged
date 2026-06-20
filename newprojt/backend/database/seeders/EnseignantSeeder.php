<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Enseignant;
use App\Models\User;
use App\Models\School;
use Illuminate\Support\Facades\Hash;

class EnseignantSeeder extends Seeder
{
    public function run(): void
    {
        $school = School::first();

        $subjects = ['Mathématiques', 'Français', 'Arabe', 'Sciences', 'Histoire-Géo', 'Anglais', 'Arts Plastiques', 'Sport'];

        foreach ($subjects as $index => $subject) {
            $user = User::create([
                'name' => 'Professeur ' . ($index + 1),
                'email' => 'prof' . ($index + 1) . '@eduflow.ma',
                'password' => Hash::make('password'),
                'role' => 'enseignant',
                'school_id' => $school->id,
                'active' => true
            ]);

            Enseignant::create([
                'user_id' => $user->id,
                'nom' => 'NomProf' . ($index + 1),
                'prenom' => 'PrenomProf' . ($index + 1),
                'matiere' => $subject,
                'school_id' => $school->id,
                'date_recrutement' => now()->subMonths(rand(1, 24))
            ]);
        }
    }
}

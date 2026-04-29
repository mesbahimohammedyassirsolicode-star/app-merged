<?php

namespace Database\Seeders;

use App\Models\Evaluation;
use App\Models\Groupe;
use App\Models\Note;
use App\Models\Stagiaire;
use App\Models\User;
use Illuminate\Database\Seeder;

class MarksSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Seeding Marks (Grades)...');

        // Find Affectations for TSGMP
        $group = Groupe::where('label', 'TSGMP 101')->first();
        if (! $group) {
            $this->command->error('TSGMP 101 not found.');

            return;
        }

        $users = User::whereHas('groups', function ($q) use ($group) {
            $q->where('groupes.id', $group->id);
        })->with('modules')->get();

        $stagiaires = $group->stagiaires()->get();

        if ($users->isEmpty()) {
            $this->command->error('No teachers found with assignments for this group.');

            // Note: In a real scenario, we might want to manually assign some if not found,
            // but for this seeder we assume TimetableSeeder ran.
            return;
        }

        if ($stagiaires->isEmpty()) {
            $this->command->info('Group empty. Enrolling 20 students...');
            $students = Stagiaire::whereDoesntHave('groupes', function ($q) use ($group) {
                $q->where('groupes.id', $group->id);
            })->take(20)->get();

            foreach ($students as $s) {
                $s->groupes()->attach($group->id);
            }
            $stagiaires = $group->stagiaires()->get();
        }

        if ($stagiaires->isEmpty()) {
            $this->command->error('Still no stagiaires found.');

            return;
        }

        $evalTypes = [
            ['title' => 'Contrôle Continu 1', 'coefficient' => 1, 'type' => 'CC'],
            ['title' => 'Contrôle Continu 2', 'coefficient' => 1, 'type' => 'CC'],
            ['title' => 'Examen de Fin de Module', 'coefficient' => 2, 'type' => 'EFM'],
        ];

        foreach ($users as $user) {
            foreach ($user->modules as $module) {
                foreach ($evalTypes as $type) {
                    $eval = Evaluation::firstOrCreate(
                        [
                            'user_id' => $user->id,
                            'module_id' => $module->id,
                            'groupe_id' => $group->id,
                            'title' => $type['title'],
                        ],
                        [
                            'coefficient' => $type['coefficient'],
                            'date' => now()->subDays(rand(1, 30))->toDateString(),
                            'max_note' => 20,
                        ]
                    );

                    foreach ($stagiaires as $stagiaire) {
                        // Random grade between 8 and 18
                        Note::updateOrCreate(
                            ['evaluation_id' => $eval->id, 'stagiaire_id' => $stagiaire->id],
                            ['value' => rand(8, 18) + (rand(0, 3) / 4)]
                        );
                    }
                }
            }
        }

        $this->command->info('Marks seeded successfully.');
    }
}

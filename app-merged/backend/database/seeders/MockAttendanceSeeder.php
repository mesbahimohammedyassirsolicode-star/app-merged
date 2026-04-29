<?php

namespace Database\Seeders;

use App\Models\Attendance;
use App\Models\Seance;
use Illuminate\Database\Seeder;

class MockAttendanceSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Seeding Mock Attendance Data...');

        // Get all seances that don't have attendance yet
        $seances = Seance::whereDoesntHave('attendances')->with('affectation.groupe')->get();

        foreach ($seances as $seance) {
            $group = $seance->affectation->groupe;
            if (! $group) {
                continue;
            }

            $stagiaires = $group->stagiaires()->get();
            if ($stagiaires->isEmpty()) {
                continue;
            }

            foreach ($stagiaires as $stagiaire) {
                // Randomly assign status
                // 85% Present, 10% Absent, 5% Retard
                $rand = rand(1, 100);
                if ($rand <= 85) {
                    $status = 'present';
                    $retard = 0;
                } elseif ($rand <= 95) {
                    $status = 'absent';
                    $retard = 0;
                } else {
                    $status = 'retard';
                    $retard = rand(5, 30);
                }

                Attendance::updateOrCreate(
                    ['seance_id' => $seance->id, 'stagiaire_id' => $stagiaire->id],
                    [
                        'status' => $status,
                        'retard_minutes' => $retard,
                        'justifie' => false,
                    ]
                );
            }

            // Mark seance as realised if in past or today
            if ($seance->date <= now()->toDateString()) {
                $seance->update(['status' => 'realise']);
            }
        }

        $this->command->info('Mock Attendance seeded.');
    }
}

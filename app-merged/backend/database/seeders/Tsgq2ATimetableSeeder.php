<?php

namespace Database\Seeders;

use App\Models\Affectation;
use App\Models\AnneeScolaire;
use App\Models\Filiere;
use App\Models\Formateur;
use App\Models\Groupe;
use App\Models\Module;
use App\Models\Niveau;
use App\Models\Seance;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Seeds the official TSGQ 2A timetable (EMPLOI RAMADAN FD 2025-2026).
 * Filière: TSGQ, Group: 2A, Academic Year: 2025-2026, Session 2, Matin & Soir.
 */
class Tsgq2ATimetableSeeder extends Seeder
{
    protected string $dataPath = 'database/data/tsgq_2a_emploi_2025_2026_s2.json';

    public function run(): void
    {
        $path = base_path($this->dataPath);
        if (! is_file($path)) {
            $this->command->error("Data file not found: {$path}");

            return;
        }

        $data = json_decode(file_get_contents($path), true);
        if (! $data || ! isset($data['seances'])) {
            $this->command->error('Invalid timetable JSON.');

            return;
        }

        $this->command->info('Seeding TSGQ 2A timetable (2025-2026 Session 2)...');

        DB::transaction(function () use ($data) {
            $annee = $this->ensureAnneeScolaire();
            $niveau = Niveau::firstOrCreate(
                ['code' => 'TS'],
                ['label' => 'Technicien Spécialisé']
            );
            $filiere = $this->ensureFiliere($niveau, $data['meta']);
            $group = $this->ensureGroup($filiere, $annee, $data['meta']);
            $modules = $this->ensureModules($filiere, $data['seances']);
            $formateurs = $this->ensureFormateurs($data['seances']);
            $affectations = $this->ensureAffectations($data['seances'], $group, $modules, $formateurs, $annee);
            $this->generateSeances($data['seances'], $affectations, $annee);
        });

        $this->command->info('TSGQ 2A timetable seeded successfully.');
    }

    private function ensureAnneeScolaire(): AnneeScolaire
    {
        $annee = AnneeScolaire::where('is_current', true)->first();
        if ($annee) {
            return $annee;
        }

        return AnneeScolaire::firstOrCreate(
            ['label' => '2025-2026'],
            [
                'year_start' => 2025,
                'year_end' => 2026,
                'start_date' => '2025-09-01',
                'end_date' => '2026-06-30',
                'is_current' => true,
            ]
        );
    }

    private function ensureFiliere(Niveau $niveau, array $meta): Filiere
    {
        return Filiere::firstOrCreate(
            ['code' => $meta['filiere_code']],
            [
                'niveau_id' => $niveau->id,
                'label' => $meta['filiere_label'],
                'description' => 'Emploi du temps officiel Session 2',
            ]
        );
    }

    private function ensureGroup(Filiere $filiere, AnneeScolaire $annee, array $meta): Groupe
    {
        return Groupe::firstOrCreate(
            [
                'filiere_id' => $filiere->id,
                'annee_scolaire_id' => $annee->id,
                'label' => $meta['group_label'],
            ],
            [
                'year_level' => 2,
                'capacity' => 35,
            ]
        );
    }

    /** @return array<string, Module> */
    private function ensureModules(Filiere $filiere, array $seances): array
    {
        $byCode = [];
        foreach ($seances as $s) {
            $code = $s['module_code'];
            if (isset($byCode[$code])) {
                continue;
            }
            $byCode[$code] = [
                'code' => $code,
                'label' => $s['module_label'],
            ];
        }

        $modules = [];
        foreach ($byCode as $code => $row) {
            $modules[$code] = Module::firstOrCreate(
                ['code' => $code],
                [
                    'filiere_id' => $filiere->id,
                    'label' => $row['label'],
                    'masse_horaire' => 60,
                    'coefficient' => 1,
                    'semester' => 'S2',
                ]
            );
        }

        return $modules;
    }

    /** @return array<string, Formateur> */
    private function ensureFormateurs(array $seances): array
    {
        $names = array_unique(array_column($seances, 'teacher'));
        $formateurs = [];

        foreach ($names as $displayName) {
            $slug = strtolower(preg_replace('/[^a-z0-9]+/i', '_', trim(str_replace(['M.', 'Mme.', 'M '], '', $displayName))));
            $email = $slug.'@gims.ma';
            $name = trim(preg_replace('/^\s*(M\.|Mme\.?|M\s+)\s*/i', '', $displayName));

            $user = User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => $name,
                    'password' => bcrypt('Password123'),
                ]
            );

            $formateurs[$displayName] = Formateur::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'matricule' => 'F_TSGQ_'.$user->id,
                    'specialty' => $name,
                    'type' => 'permanent',
                ]
            );
        }

        return $formateurs;
    }

    /** @return array<string, Affectation> */
    private function ensureAffectations(
        array $seances,
        Groupe $group,
        array $modules,
        array $formateurs,
        AnneeScolaire $annee
    ): array {
        $keyed = [];
        foreach ($seances as $s) {
            $code = $s['module_code'];
            $teacher = $s['teacher'];
            $key = $code.'|'.$teacher;
            if (isset($keyed[$key])) {
                continue;
            }
            if (! isset($modules[$code]) || ! isset($formateurs[$teacher])) {
                continue;
            }
            $keyed[$key] = Affectation::firstOrCreate(
                [
                    'formateur_id' => $formateurs[$teacher]->id,
                    'groupe_id' => $group->id,
                    'module_id' => $modules[$code]->id,
                    'annee_scolaire_id' => $annee->id,
                ],
                [
                    'start_date' => $annee->start_date,
                    'end_date' => $annee->end_date,
                ]
            );
        }

        return $keyed;
    }

    private function generateSeances(array $seances, array $affectations, AnneeScolaire $annee): void
    {
        $dayOffset = [
            'Monday' => 0,
            'Tuesday' => 1,
            'Wednesday' => 2,
            'Thursday' => 3,
            'Friday' => 4,
        ];

        $start = Carbon::parse($annee->start_date)->startOfWeek(Carbon::MONDAY);
        $end = Carbon::parse($annee->end_date);
        $weeks = (int) ceil($start->diffInWeeks($end)) ?: 1;
        $weeks = min($weeks, 20);

        for ($w = 0; $w < $weeks; $w++) {
            $weekStart = $start->copy()->addWeeks($w);
            foreach ($seances as $s) {
                $day = $s['day'] ?? null;
                if (! isset($dayOffset[$day])) {
                    continue;
                }
                $date = $weekStart->copy()->addDays($dayOffset[$day]);
                if ($date->gt($end)) {
                    continue;
                }
                $key = $s['module_code'].'|'.$s['teacher'];
                $aff = $affectations[$key] ?? null;
                if (! $aff) {
                    continue;
                }
                $startTime = $this->normalizeTime($s['start']);
                $endTime = $this->normalizeTime($s['end']);

                Seance::firstOrCreate(
                    [
                        'affectation_id' => $aff->id,
                        'date' => $date->format('Y-m-d'),
                        'start_time' => $startTime,
                        'end_time' => $endTime,
                    ],
                    [
                        'salle' => $s['room'] ?? null,
                        'status' => 'planifie',
                        'type' => 'presentiel',
                    ]
                );
            }
        }

        $this->command->info("Seances created/ensured for {$weeks} weeks.");
    }

    private function normalizeTime(string $t): string
    {
        if (preg_match('/^\d{1,2}:\d{2}$/', $t)) {
            return $t.':00';
        }

        return strlen($t) === 5 ? $t.':00' : $t;
    }
}

<?php

namespace Database\Seeders;

use App\Models\AnneeScolaire;
use App\Models\Filiere;
use App\Models\Groupe;
use App\Models\Niveau;
use App\Models\Role;
use App\Models\Stagiaire;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Seeds stagiaires with realistic Moroccan names and valid CINs.
 * Use to replace Western/fake names or populate demo groups.
 */
class MoroccanStagiairesSeeder extends Seeder
{
    /** Moroccan first names (prénoms) */
    protected array $prenoms = [
        'Ahmed', 'Mohammed', 'Omar', 'Youssef', 'Karim', 'Hassan', 'Khalid', 'Rachid',
        'Fatima', 'Aicha', 'Laila', 'Nadia', 'Samira', 'Zineb', 'Salma', 'Sara', 'Amal', 'Lina',
        'Adil', 'Mehdi', 'Anas', 'Ilyas', 'Othmane', 'Marouane', 'Amine', 'Yassine',
    ];

    /** Moroccan family names (noms de famille) */
    protected array $noms = [
        'Alami', 'Benali', 'Tazi', 'Idrissi', 'El Amrani', 'Ouazzani', 'Bennani',
        'El Fassi', 'Boussaid', 'Chaoui', 'El Khatib', 'Hajji', 'Lamrani', 'El Moussaoui',
        'Berrada', 'Chraibi', 'Fassi', 'Kettani', 'Belkadi', 'Mansouri',
    ];

    public function run(): void
    {
        $this->command->info('Seeding Moroccan stagiaires...');

        $roleStagiaire = Role::where('slug', 'student')->first();
        if (! $roleStagiaire) {
            $this->command->error('Role student not found.');

            return;
        }

        $annee = AnneeScolaire::where('is_current', true)->first()
            ?? AnneeScolaire::firstOrCreate(['label' => '2025-2026'], [
                'year_start' => 2025, 'year_end' => 2026,
                'start_date' => '2025-09-01', 'end_date' => '2026-07-31', 'is_current' => true,
            ]);

        $niveau = Niveau::firstOrCreate(['code' => 'TS'], ['label' => 'Technicien Spécialisé']);
        $filiere = Filiere::firstOrCreate(
            ['code' => 'TSGE'],
            ['niveau_id' => $niveau->id, 'label' => 'Technicien Spécialisé en Gestion des Entreprises', 'description' => '']
        );
        $groupe = Groupe::firstOrCreate(
            ['filiere_id' => $filiere->id, 'annee_scolaire_id' => $annee->id, 'label' => 'TSGE 101'],
            ['year_level' => 1, 'capacity' => 30]
        );

        $prefixes = ['AB', 'CD', 'EF', 'GH', 'IJ', 'KL', 'MN', 'OP', 'QR', 'ST'];
        $usedCins = Stagiaire::pluck('cin')->filter()->toArray();

        for ($i = 0; $i < 25; $i++) {
            $prenom = $this->prenoms[array_rand($this->prenoms)];
            $nom = $this->noms[array_rand($this->noms)];
            $name = "{$prenom} {$nom}";
            $slug = strtolower(preg_replace('/[^a-z0-9]+/i', '', $prenom.$nom)).($i + 1);
            $email = $slug.'@gims.ma';

            if (User::where('email', $email)->exists()) {
                continue;
            }

            do {
                $prefix = $prefixes[array_rand($prefixes)];
                $num = str_pad((string) (100001 + $i * 37 + rand(1, 99)), 6, '0', STR_PAD_LEFT);
                $cin = $prefix.$num;
            } while (in_array($cin, $usedCins, true));
            $usedCins[] = $cin;

            $user = User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => $name,
                    'password' => bcrypt('Password123'),
                    'role' => 'student',
                    'is_active' => true,
                ]
            );
            $user->roles()->syncWithoutDetaching([$roleStagiaire->id]);

            $stagiaire = Stagiaire::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'filiere_id' => $filiere->id,
                    'cin' => $cin,
                    'cef_number' => 'M'.str_pad((string) ($user->id + 130000), 10, '0', STR_PAD_LEFT),
                    'date_naissance' => now()->subYears(rand(18, 25))->format('Y-m-d'),
                    'niveau_scolaire' => ['BAC', 'BAC+2'][rand(0, 1)],
                    'niveau_formation' => 'TS',
                    'status' => 'actif',
                ]
            );

            $groupe->stagiaires()->syncWithoutDetaching([$stagiaire->id]);
        }

        $this->command->info('Moroccan stagiaires seeded.');
    }
}

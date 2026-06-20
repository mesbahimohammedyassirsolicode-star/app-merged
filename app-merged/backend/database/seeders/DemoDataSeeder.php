<?php

namespace Database\Seeders;

use App\Models\AnneeScolaire;
use App\Models\Formateur;
use App\Models\Niveau;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        echo "Starting Demo Data Seeder...\n";

        // 1. Année Scolaire
        $annee = AnneeScolaire::firstOrCreate(
            ['label' => '2025-2026'],
            [
                'year_start' => 2025,
                'year_end' => 2026,
                'is_current' => true,
                'start_date' => '2025-09-01',
                'end_date' => '2026-07-31',
            ]
        );
        echo 'Year created: '.$annee->label."\n";

        // 2. Niveaux
        $niveaux = [
            ['code' => 'TS', 'label' => 'Technicien Spécialisé'],
            ['code' => 'T', 'label' => 'Technicien'],
            ['code' => 'Q', 'label' => 'Qualification'],
        ];
        foreach ($niveaux as $n) {
            Niveau::firstOrCreate(['code' => $n['code']], $n);
        }

        // 3. Filières – DD, ID, GE removed (TSGE created by Tsge1ATimetableSeeder)

        // 4. Formateurs (Teachers)
        $teachersData = [
            ['email' => 'alami@gims.ma', 'name' => 'Mr. Ahmed Alami', 'specialty' => 'Développement'],
            ['email' => 'benani@gims.ma', 'name' => 'Mme. Sarah Benani', 'specialty' => 'Gestion'],
            ['email' => 'tazi@gims.ma', 'name' => 'Mr. Karim Tazi', 'specialty' => 'Réseaux'],
            ['email' => 'idrissi@gims.ma', 'name' => 'Mme. Layla Idrissi', 'specialty' => 'Communication'],
        ];

        $roleFormateur = Role::where('slug', 'formateur')->first() ?? Role::where('slug', 'teacher')->first();
        if (! $roleFormateur) {
            echo "Role formateur not found! Run seeding first.\n";

            return;
        }

        $formateurs = [];
        foreach ($teachersData as $t) {
            $user = User::firstOrCreate(
                ['email' => $t['email']],
                [
                    'name' => $t['name'],
                    'password' => 'Password123',
                    'role' => 'formateur',
                    'is_active' => true,
                ]
            );

            // Ensure permissions/role
            if (! $user->roles()->where('slug', $roleFormateur->slug)->exists()) {
                $user->roles()->attach($roleFormateur->id);
            }

            // Explicitly set password to ensure hash
            $user->password = 'Password123';
            $user->save();

            $prof = Formateur::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'matricule' => 'F'.str_pad($user->id, 4, '0', STR_PAD_LEFT),
                    'specialty' => $t['specialty'],
                    'type' => 'permanent',
                ]
            );
            $formateurs[] = $prof;
        }
        echo "Teachers created.\n";
    }
}

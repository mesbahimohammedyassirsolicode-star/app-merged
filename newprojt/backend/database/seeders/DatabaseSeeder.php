<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            SchoolSeeder::class,
            UserSeeder::class,
            NiveauSeeder::class,
            EnseignantSeeder::class,
            ClasseSeeder::class,
            EleveSeeder::class,
            PaiementSeeder::class,
            AbsenceSeeder::class,
        ]);
    }
}

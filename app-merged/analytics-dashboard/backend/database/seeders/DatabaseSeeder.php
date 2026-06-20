<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * @return void
     */
    public function run()
    {
        // Seed modules
        DB::table('modules')->insert([
            ['name' => 'Développement Web'],
            ['name' => 'Data Science'],
            ['name' => 'Intelligence Artificielle'],
        ]);

        // Seed groups
        DB::table('groups')->insert([
            ['name' => 'GI101'],
            ['name' => 'GI102'],
            ['name' => 'GI201'],
        ]);

        // Seed analytics records
        DB::table('analytics_records')->insert([
            ['module_id' => 1, 'group_id' => 1, 'date' => now(), 'notes' => 85, 'absences' => 2],
            ['module_id' => 2, 'group_id' => 2, 'date' => now(), 'notes' => 90, 'absences' => 1],
            ['module_id' => 3, 'group_id' => 3, 'date' => now(), 'notes' => 78, 'absences' => 3],
        ]);
    }
}
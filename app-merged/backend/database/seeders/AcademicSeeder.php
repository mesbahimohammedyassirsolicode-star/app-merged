<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;

class AcademicSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $jsonPath = database_path('data/academic.json');

        if (! File::exists($jsonPath)) {
            $this->command->error("JSON file not found at: {$jsonPath}");

            return;
        }

        $data = json_decode(File::get($jsonPath), true);

        if (! $data) {
            $this->command->error('Failed to decode JSON or empty data.');

            return;
        }

        Schema::disableForeignKeyConstraints();
        DB::table('modules')->truncate();
        DB::table('groupes')->truncate();
        DB::table('niveaux')->truncate();
        DB::table('filieres')->truncate();
        Schema::enableForeignKeyConstraints();

        // Insert structured data
        foreach ($data as $filiere) {

            $f = DB::table('filieres')->insertGetId([
                'code' => $filiere['filiere_code'],
                'name' => $filiere['filiere_name'],
                'type' => $filiere['type'],
                'duration_years' => $filiere['duration_years'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            foreach ($filiere['niveaux'] as $niveau) {

                $n = DB::table('niveaux')->insertGetId([
                    'filiere_id' => $f,
                    'name' => $niveau['niveau_nom'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                foreach ($niveau['groupes_prevus'] as $group) {
                    DB::table('groupes')->insert([
                        'niveau_id' => $n,
                        'filiere_id' => $f,
                        'name' => $group,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                foreach ($niveau['modules'] as $module) {
                    DB::table('modules')->insert([
                        'niveau_id' => $n,
                        'code' => $module['code'],
                        'name' => $module['name'],
                        'coefficient' => $module['coefficient'],
                        'masse_horaire' => $module['masse_horaire'],
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }

        $this->command->info('Academic data imported successfully.');
    }
}

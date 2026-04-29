<?php

namespace Database\Seeders;

use App\Models\Filiere;
use App\Models\Groupe;
use App\Models\Module;
use App\Models\Niveau;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;

class GimsAcademicSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $jsonPath = database_path('data/academic.json');

        if (! File::exists($jsonPath)) {
            $this->command->error("File not found at: {$jsonPath}");

            return;
        }

        $jsonData = File::get($jsonPath);
        $filieres = json_decode($jsonData, true);

        if (is_null($filieres)) {
            $this->command->error("Invalid JSON data in: {$jsonPath}");

            return;
        }

        foreach ($filieres as $fData) {
            $filiere = Filiere::updateOrCreate(
                ['code' => $fData['filiere_code']],
                [
                    'name' => $fData['filiere_name'],
                    'label' => $fData['filiere_name'],
                    'type' => $fData['type'],
                    'required_level' => $fData['required_level'],
                    'duration_years' => $fData['duration_years'],
                ]
            );

            foreach ($fData['niveaux'] as $nData) {
                $yearLevel = (strpos($nData['niveau_nom'], '1A') !== false) ? 1 : 2;
                $niveau = Niveau::updateOrCreate(
                    [
                        'filiere_id' => $filiere->id,
                        'name' => $nData['niveau_nom'],
                    ],
                    [
                        'label' => $nData['niveau_nom'],
                        'code' => $nData['niveau_nom'],
                    ]
                );

                foreach ($nData['groupes_prevus'] as $gName) {
                    Groupe::updateOrCreate(
                        [
                            'niveau_id' => $niveau->id,
                            'filiere_id' => $filiere->id,
                            'name' => $gName,
                            'year_level' => $yearLevel,
                        ],
                        [
                            'label' => $gName,
                            'capacity' => 30,
                        ]
                    );
                }

                $moduleCount = count($nData['modules']);
                $half = ceil($moduleCount / 2);

                foreach ($nData['modules'] as $index => $mData) {
                    $semester = ($yearLevel === 1)
                        ? ($index < $half ? 'S1' : 'S2')
                        : ($index < $half ? 'S3' : 'S4');

                    Module::updateOrCreate(
                        ['code' => $mData['code']],
                        [
                            'niveau_id' => $niveau->id,
                            'filiere_id' => $filiere->id,
                            'name' => $mData['name'],
                            'label' => $mData['name'],
                            'coefficient' => $mData['coefficient'],
                            'masse_horaire' => $mData['masse_horaire'],
                            'semester' => $semester,
                        ]
                    );
                }
            }
        }

        $this->command->info('Academic structure synchronization completed successfully.');
    }
}

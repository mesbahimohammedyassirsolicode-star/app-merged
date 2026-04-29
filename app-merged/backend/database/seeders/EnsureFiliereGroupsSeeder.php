<?php

namespace Database\Seeders;

use App\Models\Filiere;
use Illuminate\Database\Seeder;

class EnsureFiliereGroupsSeeder extends Seeder
{
    public function run(): void
    {
        Filiere::query()
            ->withCount('groups')
            ->get()
            ->each(function (Filiere $filiere): void {
                $filiere->ensureMinimumGroups(2);
            });
    }
}

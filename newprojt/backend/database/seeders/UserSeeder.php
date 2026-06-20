<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\School;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $school = School::first();
        if (! $school) {
            throw new \RuntimeException('SchoolSeeder must run before UserSeeder.');
        }

        // Plain password: User model uses 'hashed' cast (do not Hash::make here).
        User::updateOrCreate(
            ['email' => 'admin@eduflow.ma'],
            [
                'name' => 'Admin EduFlow',
                'password' => 'password',
                'role' => 'admin',
                'school_id' => $school->id,
                'active' => true,
            ]
        );

        User::updateOrCreate(
            ['email' => 'superadmin@eduflow.ma'],
            [
                'name' => 'Super Admin',
                'password' => 'password',
                'role' => 'super_admin',
                'school_id' => $school->id,
                'active' => true,
            ]
        );
    }
}

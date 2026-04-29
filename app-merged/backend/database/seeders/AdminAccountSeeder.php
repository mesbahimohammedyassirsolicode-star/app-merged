<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class AdminAccountSeeder extends Seeder
{
    /**
     * Default web admin for local/demo (matches backend/ensure_admin.php).
     */
    public function run(): void
    {
        $adminRole = Role::where('slug', 'admin')->first();
        if (! $adminRole) {
            return;
        }

        $user = User::updateOrCreate(
            ['email' => 'admin@gims.ma'],
            [
                'name' => 'Administrator',
                'password' => 'Password123',
                'role' => 'admin',
                'is_active' => true,
            ]
        );

        $user->password = 'Password123';
        $user->save();

        if (! $user->roles()->where('slug', 'admin')->exists()) {
            $user->roles()->attach($adminRole->id);
        }
    }
}

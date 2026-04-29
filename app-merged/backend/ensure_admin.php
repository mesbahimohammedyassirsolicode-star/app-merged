<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

use App\Models\Role;
use App\Models\User;
use Illuminate\Contracts\Console\Kernel;

echo "Checking for admin user...\n";

// First ensure we have the admin role
$adminRole = Role::where('slug', 'admin')->first();
if (! $adminRole) {
    echo "Admin role not found! Creating it...\n";
    $adminRole = Role::create(['name' => 'Admin', 'slug' => 'admin', 'description' => 'Administration']);
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

// Explicitly set/reset password to ensure it matches Password123
$user->password = 'Password123';
$user->save();

if (! $user->roles()->where('slug', 'admin')->exists()) {
    $user->roles()->attach($adminRole->id);
}

echo "Admin User: admin@gims.ma / Password123\n";
echo "Successfully ensured admin user exists and is configured.\n";

<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Contracts\Console\Kernel;

$admins = User::where('role', 'admin')->get(['email', 'name', 'role']);

if ($admins->isEmpty()) {
    echo "No admin user found. Creating one...\n";
    $user = User::create([
        'name' => 'Admin User',
        'email' => 'admin@gims.ma',
        'password' => 'Password123',
        'role' => 'admin',
        'is_active' => true,
    ]);
    echo "Created Admin User: admin@gims.ma / Password123\n";
} else {
    echo "Found Admin Users:\n";
    foreach ($admins as $admin) {
        echo "- {$admin->name} ({$admin->email})\n";
    }
    echo "\nDefault password is likely 'Password123' if seeded recently.\n";
}

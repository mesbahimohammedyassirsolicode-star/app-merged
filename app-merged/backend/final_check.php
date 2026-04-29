<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Contracts\Console\Kernel;

$admin = User::where('role', 'admin')->first();
if ($admin) {
    echo 'Admin Email: '.$admin->email."\n";
    // Assuming Password123 from seeders or DemoDataSeeder
} else {
    echo "No admin user found yet. Creating one...\n";
    $admin = User::updateOrCreate(
        ['email' => 'admin@gims.ma'],
        [
            'name' => 'Administrator',
            'password' => 'Password123',
            'role' => 'admin',
            'is_active' => true,
        ]
    );
    echo "Admin Created: admin@gims.ma / Password123\n";
}

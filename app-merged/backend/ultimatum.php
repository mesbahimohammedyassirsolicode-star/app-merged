<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

echo 'Current Connection: '.DB::getDefaultConnection()."\n";
echo 'Current Database: '.DB::getDatabaseName()."\n";

echo "Forcing migration...\n";
Artisan::call('migrate:fresh', ['--force' => true]);

echo "Checking for 'users' table...\n";
if (Schema::hasTable('users')) {
    echo "Table 'users' exists. Creating admin...\n";
    $user = User::updateOrCreate(
        ['email' => 'admin@gims.ma'],
        [
            'name' => 'Administrator',
            'password' => 'Password123',
            'role' => 'admin',
            'is_active' => true,
        ]
    );
    echo "Admin created: admin@gims.ma / Password123\n";
} else {
    echo "Table 'users' still DOES NOT EXIST!\n";

    echo "Raw SQL attempt to create users table...\n";
    try {
        DB::statement('CREATE TABLE users (id SERIAL PRIMARY KEY, name VARCHAR(255), email VARCHAR(255) UNIQUE, password VARCHAR(255), role VARCHAR(50), deleted_at TIMESTAMP NULL, created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL)');
        echo "Raw creation success!\n";
    } catch (Exception $e) {
        echo 'Raw creation failed: '.$e->getMessage()."\n";
    }
}

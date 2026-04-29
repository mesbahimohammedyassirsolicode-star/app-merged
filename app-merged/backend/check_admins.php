<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Contracts\Console\Kernel;

$admins = User::where('role', 'admin')->get();
echo 'Admins found: '.$admins->count()."\n";
foreach ($admins as $admin) {
    echo '- Email: '.$admin->email.', Name: '.$admin->name."\n";
}

$userAdmin = User::where('email', 'admin@gims.ma')->first();
if ($userAdmin) {
    echo "Default admin exists: admin@gims.ma\n";
} else {
    echo "Default admin admin@gims.ma does NOT exist.\n";
}

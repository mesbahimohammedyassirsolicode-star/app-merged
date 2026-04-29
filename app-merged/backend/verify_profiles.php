<?php

use App\Models\User;
use Illuminate\Contracts\Console\Kernel;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

$users = User::all();
$stats = [
    'total' => $users->count(),
    'ok' => 0,
    'missing_profile' => 0,
    'details' => [],
];

foreach ($users as $user) {
    $hasProfile = match ($user->role) {
        'admin' => $user->administrator()->exists(),
        'formateur', 'teacher' => $user->formateur()->exists(),
        'stagiaire', 'student' => $user->stagiaire()->exists(),
        'parent' => $user->parent()->exists(),
        default => true,
    };

    if ($hasProfile) {
        $stats['ok']++;
    } else {
        $stats['missing_profile']++;
        $stats['details'][] = "User ID {$user->id} ({$user->email}) role '{$user->role}' is missing profile.";
    }
}

echo "Verification Results:\n";
echo "Total Users: {$stats['total']}\n";
echo "Profiles OK: {$stats['ok']}\n";
echo "Missing Profiles: {$stats['missing_profile']}\n";
foreach ($stats['details'] as $detail) {
    echo "- $detail\n";
}

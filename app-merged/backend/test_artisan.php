<?php

use Illuminate\Contracts\Console\Kernel;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Kernel::class);
try {
    $kernel->call('migrate:status');
    file_put_contents(__DIR__.'/artisan_error.txt', $kernel->output());
} catch (Throwable $e) {
    file_put_contents(__DIR__.'/artisan_error.txt', 'Exception: '.$e->getMessage()."\n".$e->getTraceAsString());
}

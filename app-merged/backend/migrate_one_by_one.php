<?php

$migrations = glob('database/migrations/*.php');
sort($migrations);

foreach ($migrations as $migrationFile) {
    $migrationName = basename($migrationFile);
    echo "Running migration: $migrationName...\n";
    $start = microtime(true);
    $output = shell_exec("php artisan migrate --path=database/migrations/$migrationName --force 2>&1");
    $end = microtime(true);
    echo $output;
    echo 'Duration: '.round($end - $start, 2)."s\n\n";

    if (strpos($output, 'FAIL') !== false || strpos($output, 'Error') !== false) {
        echo "STOPPING: Error in $migrationName\n";
        break;
    }
}

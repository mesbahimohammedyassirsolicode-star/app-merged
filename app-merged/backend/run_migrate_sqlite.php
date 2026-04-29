<?php

echo "Running php artisan migrate:fresh --seed with SQLite...\n";
$output = shell_exec('php artisan migrate:fresh --seed --no-interaction --force 2>&1');
echo $output;

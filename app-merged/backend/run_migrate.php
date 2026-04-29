<?php

echo "Running php artisan migrate --force...\n";
$output = shell_exec('php artisan migrate --force 2>&1');
echo $output;

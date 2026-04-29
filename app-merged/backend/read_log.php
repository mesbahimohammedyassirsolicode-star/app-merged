<?php

$logFile = 'storage/logs/laravel.log';
if (file_exists($logFile)) {
    $content = file_get_contents($logFile);
    $pos = strrpos($content, 'local.ERROR');
    if ($pos !== false) {
        echo substr($content, $pos, 10000);
    } else {
        echo "No ERROR found in log.\n";
    }
} else {
    echo "Log file not found.\n";
}

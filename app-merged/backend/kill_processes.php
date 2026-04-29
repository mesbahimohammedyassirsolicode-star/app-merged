<?php

try {
    $db = new PDO('mysql:host=127.0.0.1', 'root', '');
    $q = $db->query('SHOW FULL PROCESSLIST');
    $processes = $q->fetchAll(PDO::FETCH_ASSOC);
    foreach ($processes as $p) {
        if ($p['Command'] !== 'Sleep' && (int) $p['Id'] !== 0) {
            // Kill any root process that isn't this one (if possible)
            echo "Killing process ID: {$p['Id']} ({$p['Info']})\n";
            $db->exec("KILL {$p['Id']}");
        }
    }
} catch (Exception $e) {
    echo 'Error: '.$e->getMessage()."\n";
}

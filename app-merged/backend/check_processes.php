<?php

try {
    $db = new PDO('mysql:host=127.0.0.1', 'root', '');
    $q = $db->query('SHOW FULL PROCESSLIST');
    $processes = $q->fetchAll(PDO::FETCH_ASSOC);
    foreach ($processes as $p) {
        if ($p['Command'] !== 'Sleep') {
            echo "ID: {$p['Id']}, User: {$p['User']}, Host: {$p['Host']}, db: {$p['db']}, Command: {$p['Command']}, Time: {$p['Time']}, State: {$p['State']}, Info: {$p['Info']}\n";
        }
    }
} catch (Exception $e) {
    echo 'Error: '.$e->getMessage()."\n";
}

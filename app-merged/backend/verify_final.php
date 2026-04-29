<?php

try {
    $db = new PDO('mysql:host=127.0.0.1', 'root', '');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $q = $db->query('SHOW DATABASES');
    $databases = $q->fetchAll(PDO::FETCH_COLUMN);
    echo 'Databases: '.implode(', ', $databases)."\n";
    if (in_array('gims', $databases)) {
        echo "Database 'gims' found.\n";
        $db->query('USE gims');
        $q2 = $db->query('SHOW TABLES');
        $tables = $q2->fetchAll(PDO::FETCH_COLUMN);
        echo "Tables in 'gims' (".count($tables).'): '.implode(', ', $tables)."\n";
        if (count($tables) > 0) {
            var_dump($tables);
        }
    } else {
        echo "Database 'gims' NOT found!\n";
    }
} catch (Exception $e) {
    echo 'Error: '.$e->getMessage()."\n";
}

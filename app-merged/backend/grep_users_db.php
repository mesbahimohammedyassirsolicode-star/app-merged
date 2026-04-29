<?php

try {
    $db = new PDO('mysql:host=127.0.0.1', 'root', '');
    $q = $db->query('SHOW DATABASES');
    $databases = $q->fetchAll(PDO::FETCH_COLUMN);
    foreach ($databases as $dbName) {
        if (in_array($dbName, ['information_schema', 'mysql', 'performance_schema', 'sys'])) {
            continue;
        }
        $db->query("USE `$dbName`");
        $q2 = $db->query("SHOW TABLES LIKE 'users'");
        if ($q2->fetch()) {
            echo "Table 'users' found in database: $dbName\n";
        }
    }
} catch (Exception $e) {
    echo 'Error: '.$e->getMessage()."\n";
}

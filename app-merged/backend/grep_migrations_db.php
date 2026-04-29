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
        $q2 = $db->query("SHOW TABLES LIKE 'migrations'");
        if ($q2->fetch()) {
            echo "Table 'migrations' found in database: $dbName\n";
            $q3 = $db->query('SHOW TABLES');
            $tables = $q3->fetchAll(PDO::FETCH_COLUMN);
            echo '  Total tables: '.count($tables)."\n";
        }
    }
} catch (Exception $e) {
    echo 'Error: '.$e->getMessage()."\n";
}

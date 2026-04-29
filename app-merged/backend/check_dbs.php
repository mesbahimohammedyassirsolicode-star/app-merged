<?php

$host = '127.0.0.1';
$user = 'root';
$pass = '';

$output = '';
try {
    $pdo = new PDO("mysql:host=$host", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $stmt = $pdo->query('SHOW DATABASES');
    $dbs = $stmt->fetchAll(PDO::FETCH_COLUMN);
    $output .= 'Databases: '.implode(', ', $dbs)."\n";

    foreach (['gims', 'gims_new'] as $db) {
        if (in_array($db, $dbs)) {
            $output .= "\nTables in $db:\n";
            $pdo->exec("USE $db");
            $stmt = $pdo->query('SHOW TABLES');
            $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
            foreach ($tables as $table) {
                $output .= "  $table\n";
            }
        }
    }
    file_put_contents('dbs_info.txt', $output);
    echo "Info written to dbs_info.txt\n";
} catch (PDOException $e) {
    echo 'Error: '.$e->getMessage()."\n";
}

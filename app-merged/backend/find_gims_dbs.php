<?php

$host = '127.0.0.1';
$user = 'root';
$pass = '';

try {
    $pdo = new PDO("mysql:host=$host", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $pdo->query('SHOW DATABASES');
    $dbs = $stmt->fetchAll(PDO::FETCH_COLUMN);

    echo 'Total Databases: '.count($dbs)."\n";
    foreach ($dbs as $db) {
        if (strpos($db, 'gims') !== false) {
            echo "- $db\n";
        }
    }
} catch (PDOException $e) {
    echo 'Error: '.$e->getMessage()."\n";
}

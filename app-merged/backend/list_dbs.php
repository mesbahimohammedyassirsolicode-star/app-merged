<?php

$host = '127.0.0.1';
$user = 'root';
$pass = '';

try {
    $pdo = new PDO("mysql:host=$host", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $pdo->query('SHOW DATABASES');
    $dbs = $stmt->fetchAll(PDO::FETCH_COLUMN);

    echo "Databases:\n";
    foreach ($dbs as $db) {
        echo "- $db\n";
    }
} catch (PDOException $e) {
    echo 'Error: '.$e->getMessage()."\n";
}

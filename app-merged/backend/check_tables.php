<?php

$host = '127.0.0.1';
$user = 'root';
$pass = '';
$db = 'gims_v3';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $pdo->query('SHOW TABLES');
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);

    echo "Tables in $db:\n";
    foreach ($tables as $table) {
        echo "- $table\n";
    }
    if (empty($tables)) {
        echo "No tables found.\n";
    }
} catch (PDOException $e) {
    echo 'Error: '.$e->getMessage()."\n";
}

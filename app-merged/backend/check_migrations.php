<?php

$host = '127.0.0.1';
$user = 'root';
$pass = '';
$db = 'gims_v3';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $pdo->query('SELECT * FROM migrations');
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "Completed Migrations:\n";
    foreach ($rows as $row) {
        echo "- {$row['migration']} (batch: {$row['batch']})\n";
    }
    if (empty($rows)) {
        echo "No migrations found in the table.\n";
    }
} catch (PDOException $e) {
    echo 'Error: '.$e->getMessage()."\n";
}

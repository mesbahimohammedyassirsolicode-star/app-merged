<?php

$host = '127.0.0.1';
$user = 'root';
$pass = '';

try {
    $pdo = new PDO("mysql:host=$host", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "Creating database gims_v3...\n";
    $pdo->exec('CREATE DATABASE IF NOT EXISTS gims_v3');
    echo "Database gims_v3 created successfully.\n";
} catch (PDOException $e) {
    echo 'Error: '.$e->getMessage()."\n";
}

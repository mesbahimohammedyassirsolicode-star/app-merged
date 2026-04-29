<?php

$host = '127.0.0.1';
$user = 'root';
$pass = '';

try {
    $pdo = new PDO("mysql:host=$host", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "Dropping database gims_new...\n";
    $pdo->exec('DROP DATABASE IF EXISTS gims_new');
    echo "Creating database gims_new...\n";
    $pdo->exec('CREATE DATABASE gims_new');
    echo "Database gims_new recreated successfully.\n";
} catch (PDOException $e) {
    echo 'Error: '.$e->getMessage()."\n";
}

<?php

$host = '127.0.0.1';
$user = 'root';
$pass = '';
$db = 'gims_new';

try {
    $pdo = new PDO("mysql:host=$host", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec("CREATE DATABASE IF NOT EXISTS $db");
    echo "Database '$db' created or already exists.\n";
} catch (PDOException $e) {
    echo 'Connection failed: '.$e->getMessage()."\n";
    exit(1);
}

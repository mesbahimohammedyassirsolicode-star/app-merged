<?php

$host = '127.0.0.1';
$user = 'root';
$pass = '';
$db = 'gims_brand_new';

try {
    $pdo = new PDO("mysql:host=$host", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "Creating database $db...\n";
    $pdo->exec("CREATE DATABASE $db");

    $pdo->exec("USE $db");
    echo "Creating table 'users'...\n";
    $pdo->exec('CREATE TABLE users (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255))');
    echo "Table 'users' created successfully.\n";
} catch (PDOException $e) {
    echo 'Error: '.$e->getMessage()."\n";
}

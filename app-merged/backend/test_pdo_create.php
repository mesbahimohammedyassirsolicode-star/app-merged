<?php

$host = '127.0.0.1';
$user = 'root';
$pass = '';
$db = 'gims_v3';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "Creating table 'test_users'...\n";
    $pdo->exec('CREATE TABLE test_users (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255))');
    echo "Table 'test_users' created successfully.\n";
} catch (PDOException $e) {
    echo 'Error: '.$e->getMessage()."\n";
}

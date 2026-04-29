<?php

$host = '127.0.0.1';
$user = 'root';
$pass = '';
$db = 'gims_brand_new';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "Creating MyISAM table 'test_myisam'...\n";
    $pdo->exec('CREATE TABLE test_myisam (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255)) ENGINE=MyISAM');
    echo "Table 'test_myisam' created successfully.\n";
} catch (PDOException $e) {
    echo 'Error: '.$e->getMessage()."\n";
}

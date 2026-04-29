<?php

$host = '127.0.0.1';
$user = 'root';
$pass = '';

try {
    $pdo = new PDO("mysql:host=$host", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $pdo->query("SHOW VARIABLES LIKE 'innodb%'");
    $vars = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "InnoDB Variables:\n";
    foreach ($vars as $var) {
        if (in_array($var['Variable_name'], ['innodb_read_only', 'innodb_force_recovery', 'innodb_version'])) {
            echo "- {$var['Variable_name']}: {$var['Value']}\n";
        }
    }
} catch (PDOException $e) {
    echo 'Error: '.$e->getMessage()."\n";
}

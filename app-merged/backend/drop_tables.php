<?php

$host = '127.0.0.1';
$user = 'root';
$pass = '';
$db = 'gims_new';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $pdo->exec('SET FOREIGN_KEY_CHECKS = 0;');
    $stmt = $pdo->query('SHOW TABLES');
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);

    foreach ($tables as $table) {
        $pdo->exec("DROP TABLE IF EXISTS `$table` CASCADE;");
        echo "Dropped $table\n";
    }

    $pdo->exec('SET FOREIGN_KEY_CHECKS = 1;');
    echo "All tables dropped from $db.\n";
} catch (PDOException $e) {
    echo 'Error: '.$e->getMessage()."\n";
}

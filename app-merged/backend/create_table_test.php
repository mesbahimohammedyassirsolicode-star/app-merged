<?php

try {
    $db = new PDO('mysql:host=127.0.0.1;dbname=gims', 'root', '');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "Connected to gims.\n";
    $db->exec('CREATE TABLE test_table (id INT PRIMARY KEY)');
    echo "Table 'test_table' created successfully!\n";
    $db->exec('DROP TABLE test_table');
    echo "Table 'test_table' dropped successfully!\n";
} catch (Exception $e) {
    echo 'Error: '.$e->getMessage()."\n";
}

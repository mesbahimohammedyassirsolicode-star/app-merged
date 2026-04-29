<?php

try {
    $dsn = 'mysql:host=127.0.0.1;dbname=gims_new';
    $pdo = new PDO($dsn, 'root', '');
    echo "SUCCESS: Connected to gims_new\n";
} catch (PDOException $e) {
    echo 'ERROR: '.$e->getMessage()."\n";
}

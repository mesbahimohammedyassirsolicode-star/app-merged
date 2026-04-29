<?php

try {
    $db = new PDO('mysql:host=127.0.0.1', 'root', '');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "Creating database 'gims_new'...\n";
    $db->exec('DROP DATABASE IF EXISTS `gims_new`;');
    $db->exec('CREATE DATABASE `gims_new` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
    echo "Success: Database 'gims_new' created.\n";

} catch (PDOException $e) {
    echo 'Error: '.$e->getMessage()."\n";
}

<?php

try {
    $db = new PDO('mysql:host=127.0.0.1;dbname=gims', 'root', '');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "Creating users table in gims if not exists...\n";
    $db->exec("CREATE TABLE IF NOT EXISTS users (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'teacher', 'student', 'parent') NOT NULL,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP NULL,
        updated_at TIMESTAMP NULL,
        deleted_at TIMESTAMP NULL
    )");

    $password = password_hash('Password123', PASSWORD_BCRYPT);
    $db->exec("INSERT INTO users (name, email, password, role, is_active, created_at, updated_at) 
               VALUES ('Admin', 'admin@gims.ma', '$password', 'admin', 1, NOW(), NOW())
               ON DUPLICATE KEY UPDATE password='$password'");

    echo "Admin User Created in 'gims' DB: admin@gims.ma / Password123\n";

} catch (Exception $e) {
    echo 'Error: '.$e->getMessage()."\n";
}

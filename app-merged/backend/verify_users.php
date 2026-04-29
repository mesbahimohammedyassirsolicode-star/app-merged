<?php

try {
    $pdo = new PDO('sqlite:c:/Users/setup game/Desktop/files/tgi/PFE/app-merged/backend/database/database.sqlite');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $pdo->query('SELECT count(*) FROM users');
    $count = $stmt->fetchColumn();

    echo "User count: $count\n";

    $stmt = $pdo->query('SELECT name, email, role FROM users LIMIT 5');
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($users as $user) {
        echo "- {$user['name']} ({$user['email']}) as {$user['role']}\n";
    }
} catch (PDOException $e) {
    echo 'Error: '.$e->getMessage()."\n";
}

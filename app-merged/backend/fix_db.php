<?php

try {
    $pdo = new PDO('mysql:host=127.0.0.1', 'root', '');
    $stmt = $pdo->query('SELECT @@datadir');
    $datadir = $stmt->fetchColumn();
    // Normalize path separators
    $datadir = rtrim(str_replace('\\', '/', $datadir), '/');
    $gims_dir = $datadir.'/gims_new';

    if (is_dir($gims_dir)) {
        echo "Deleting directory: $gims_dir\n";
        $files = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($gims_dir, RecursiveDirectoryIterator::SKIP_DOTS),
            RecursiveIteratorIterator::CHILD_FIRST
        );
        foreach ($files as $fileinfo) {
            $todo = ($fileinfo->isDir() ? 'rmdir' : 'unlink');
            $todo($fileinfo->getRealPath());
        }
        rmdir($gims_dir);
        echo "Deleted orphaned directory.\n";
    }

    // Now it should be safe to create DB
    $pdo->exec('DROP DATABASE IF EXISTS gims_new');
    $pdo->exec('CREATE DATABASE gims_new CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    echo "Successfully recreated gims_new database!\n";
} catch (Throwable $e) {
    echo 'Error: '.$e->getMessage()."\n";
}

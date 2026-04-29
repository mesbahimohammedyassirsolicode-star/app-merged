<?php

$dir = 'C:\\xampp\\mysql\\data\\gims\\';
if (is_dir($dir)) {
    $files = scandir($dir);
    echo "Current files in $dir:\n";
    foreach ($files as $file) {
        if ($file === '.' || $file === '..') {
            continue;
        }
        $path = $dir.$file;
        echo "- $file (deleting...)\n";
        if (is_file($path)) {
            unlink($path);
        } elseif (is_dir($path)) {
            // Should not happen for MySQL db dir usually, but for completeness:
            array_map('unlink', glob("$path/*.*"));
            rmdir($path);
        }
    }
}
echo "Full cleanup completed.\n";

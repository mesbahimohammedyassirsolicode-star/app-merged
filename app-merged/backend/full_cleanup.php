<?php

$dir = 'C:\\xampp\\mysql\\data\\gims\\';
if (is_dir($dir)) {
    $files = scandir($dir);
    echo "Files in gims database directory:\n";
    foreach ($files as $file) {
        if (str_ends_with($file, '.ibd') || str_ends_with($file, '.frm')) {
            echo "Deleting $file...\n";
            unlink($dir.$file);
        }
    }
} else {
    echo "Directory not found.\n";
}
echo "Cleanup complete.\n";

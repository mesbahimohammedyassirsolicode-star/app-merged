<?php

$dir = 'database/migrations';
$files = glob($dir.'/*.php');

foreach ($files as $file) {
    if ($file === 'fix_migrations.php') {
        continue;
    }
    $content = file_get_contents($file);
    // Be more flexible with the search.
    if (preg_match('/\$table\)/', $content) && strpos($content, 'use Illuminate\Database\Schema\Blueprint;') === false) {
        if (strpos($content, 'Blueprint') !== false) {
            echo "Fixing $file\n";
            $content = str_replace(
                'use Illuminate\Database\Migrations\Migration;',
                "use Illuminate\Database\Migrations\Migration;\nuse Illuminate\Database\Schema\Blueprint;",
                $content
            );
            file_put_contents($file, $content);
        }
    }
}

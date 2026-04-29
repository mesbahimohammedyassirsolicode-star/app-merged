<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Maximum upload size (kilobytes) — Laravel "max" rule uses kilobytes.
    | Example: 51200 ≈ 50 MB
    |--------------------------------------------------------------------------
    */
    'max_size_kb' => (int) env('COURSE_FILE_MAX_SIZE_KB', 51_200),

    /*
    |--------------------------------------------------------------------------
    | Storage disk (must be private — no public URL)
    |--------------------------------------------------------------------------
    */
    'disk' => env('COURSE_FILE_DISK', 'course_files'),

];

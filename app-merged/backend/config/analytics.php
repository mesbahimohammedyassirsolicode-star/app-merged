<?php

return [
    'conversation' => [
        'max_recent_messages' => env('ANALYTICS_CONVERSATION_MAX_MESSAGES', 12),
    ],

    'copilot' => [
        'default_cache_ttl' => env('ANALYTICS_CACHE_TTL', 300),
        'max_rows' => env('ANALYTICS_MAX_ROWS', 100),
    ],

    'metrics' => [
        'attendance_rate' => [
            'label' => 'Attendance Rate',
            'description' => 'Percentage of present/late attendance records in the selected scope.',
            'roles' => ['admin', 'directeur', 'secretariat', 'teacher', 'formateur', 'parent', 'student', 'stagiaire'],
            'default_chart' => 'line',
            'cache_ttl' => 300,
            'supported_dimensions' => ['day', 'week', 'month', 'group', 'module', 'student'],
        ],
        'absence_count' => [
            'label' => 'Absence Count',
            'description' => 'Count of absent attendance records.',
            'roles' => ['admin', 'directeur', 'secretariat', 'teacher', 'formateur', 'parent', 'student', 'stagiaire'],
            'default_chart' => 'bar',
            'cache_ttl' => 300,
            'supported_dimensions' => ['day', 'week', 'month', 'group', 'module', 'student'],
        ],
        'average_grade' => [
            'label' => 'Average Grade',
            'description' => 'Average note value in the selected scope.',
            'roles' => ['admin', 'directeur', 'secretariat', 'teacher', 'formateur', 'parent', 'student', 'stagiaire'],
            'default_chart' => 'bar',
            'cache_ttl' => 300,
            'supported_dimensions' => ['week', 'month', 'group', 'module', 'student'],
        ],
        'pass_rate' => [
            'label' => 'Pass Rate',
            'description' => 'Percentage of grades at or above passing threshold.',
            'roles' => ['admin', 'directeur', 'secretariat', 'teacher', 'formateur', 'parent', 'student', 'stagiaire'],
            'default_chart' => 'bar',
            'cache_ttl' => 300,
            'supported_dimensions' => ['week', 'month', 'group', 'module', 'student'],
        ],
        'risk_score' => [
            'label' => 'Risk Score',
            'description' => 'Composite risk score based on attendance and grade trends.',
            'roles' => ['admin', 'directeur', 'secretariat', 'teacher', 'formateur', 'parent'],
            'default_chart' => 'bar',
            'cache_ttl' => 900,
            'supported_dimensions' => ['group', 'module', 'student', 'month'],
        ],
    ],

    'dimensions' => [
        'day' => ['label' => 'Day'],
        'week' => ['label' => 'Week'],
        'month' => ['label' => 'Month'],
        'group' => ['label' => 'Group'],
        'module' => ['label' => 'Module'],
        'student' => ['label' => 'Student'],
    ],
];

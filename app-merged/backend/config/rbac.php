<?php

/**
 * Role → permission slugs (fallback when DB pivot is missing or incomplete).
 * DB permissions from role_user + permission_role are merged in User::effectivePermissionSlugs().
 */
return [
    /*
    | Optional: map legacy/alternate role column values to canonical config keys.
    */
    'role_slug_aliases' => [
        'stagiaire' => 'student',
        'formateur' => 'teacher',
    ],

    'role_permissions' => [
        'admin' => [
            'users.manage', 'academic.manage', 'groups.manage', 'groups.read', 'modules.manage', 'affectations.manage',
            'attendance.write', 'attendance.read', 'grades.write', 'grades.read', 'stages.manage',
            'feedbacks.read', 'timetable.read', 'timetable.manage', 'modules.read_catalog',
            'evaluations.read', 'evaluations.write', 'exports.run', 'analytics.read', 'ai.use',
            'messages.use', 'notifications.read', 'admin.parent_links', 'course_files.read',
            'progress.read', 'dashboard.read', 'parent.portal',
        ],
        'directeur' => [
            'users.manage', 'academic.manage', 'groups.manage', 'groups.read', 'modules.manage', 'affectations.manage',
            'attendance.write', 'attendance.read', 'grades.write', 'grades.read', 'stages.manage',
            'feedbacks.read', 'timetable.read', 'timetable.manage', 'modules.read_catalog',
            'evaluations.read', 'evaluations.write', 'exports.run', 'analytics.read', 'ai.use',
            'messages.use', 'notifications.read', 'course_files.read', 'progress.read', 'dashboard.read',
        ],
        'secretariat' => [
            'users.manage', 'academic.manage', 'groups.manage', 'groups.read', 'modules.manage', 'affectations.manage',
            'attendance.write', 'attendance.read', 'grades.write', 'grades.read', 'stages.manage',
            'feedbacks.read', 'timetable.read', 'timetable.manage', 'modules.read_catalog',
            'evaluations.read', 'evaluations.write', 'exports.run', 'analytics.read', 'ai.use',
            'messages.use', 'notifications.read', 'course_files.read', 'progress.read', 'dashboard.read',
        ],
        'teacher' => [
            'attendance.write', 'attendance.read', 'grades.write', 'grades.read', 'groups.read', 'modules.manage',
            'affectations.manage', 'stages.manage', 'timetable.read', 'timetable.manage',
            'modules.read_catalog', 'evaluations.read', 'evaluations.write', 'exports.run',
            'analytics.read', 'ai.use', 'messages.use', 'notifications.read', 'course_files.read',
            'progress.read', 'dashboard.read',
        ],
        'student' => [
            'grades.read', 'groups.read', 'timetable.read', 'modules.read_catalog', 'evaluations.read',
            'attendance.read', 'course_files.read', 'progress.read', 'messages.use',
            'notifications.read', 'dashboard.read', 'feedback.submit',
        ],
        'parent' => [
            'grades.read', 'groups.read', 'modules.read_catalog', 'evaluations.read', 'attendance.read',
            'course_files.read', 'progress.read', 'messages.use', 'notifications.read',
            'dashboard.read', 'analytics.read', 'ai.use', 'parent.portal', 'feedback.submit',
        ],
    ],
];

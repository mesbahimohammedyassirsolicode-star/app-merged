<?php

// Shared role group shortcuts available to all included route modules.
$allRoles = 'admin,directeur,secretariat,teacher,formateur,student,stagiaire,parent';
$staffRoles = 'admin,directeur,secretariat,teacher,formateur';
$adminRoles = 'admin,directeur,secretariat';
$teacherRoles = 'teacher,formateur';
$studentRoles = 'student,stagiaire';
$rbacAdminTrainerRoles = 'admin,trainer';
$rbacDashboardRoles = 'admin,trainer,parent,student';
$aiAssistantRoles = 'admin,directeur,secretariat,teacher,formateur,parent';

require __DIR__.'/api/auth.php';
require __DIR__.'/api/grades.php';
require __DIR__.'/api/students.php';
require __DIR__.'/api/stages.php';
require __DIR__.'/api/timetable.php';
require __DIR__.'/api/files.php';
require __DIR__.'/api/core.php';

<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // [MERGED] Combined roles from V1 (Admin, Teacher, Student, Parent) and V2 (Directeur, Secrétariat, Formateur, Stagiaire, Parent)
        $roles = [
            ['name' => 'Admin', 'slug' => 'admin', 'description' => 'Administration (V1)'],
            ['name' => 'Teacher', 'slug' => 'teacher', 'description' => 'Enseignant (V1)'],
            ['name' => 'Student', 'slug' => 'student', 'description' => 'Etudiant (V1)'],
            ['name' => 'Directeur', 'slug' => 'directeur', 'description' => 'Super Admin (V2)'],
            ['name' => 'Secrétariat', 'slug' => 'secretariat', 'description' => 'Administration (V2)'],
            ['name' => 'Formateur', 'slug' => 'formateur', 'description' => 'Enseignant (V2)'],
            ['name' => 'Stagiaire', 'slug' => 'stagiaire', 'description' => 'Étudiant (V2)'],
            ['name' => 'Parent', 'slug' => 'parent', 'description' => 'Lecture seule enfants'],
        ];

        foreach ($roles as $role) {
            Role::firstOrCreate(['slug' => $role['slug']], $role);
        }

        $permissions = [
            ['name' => 'Gérer les utilisateurs', 'slug' => 'users.manage', 'group' => 'users'],
            ['name' => 'Gérer la structure académique', 'slug' => 'academic.manage', 'group' => 'academic'],
            ['name' => 'Gérer les groupes et inscriptions', 'slug' => 'groups.manage', 'group' => 'groups'],
            ['name' => 'Consulter les groupes', 'slug' => 'groups.read', 'group' => 'groups'],
            ['name' => 'Gérer les modules et syllabus', 'slug' => 'modules.manage', 'group' => 'modules'],
            ['name' => 'Gérer les affectations', 'slug' => 'affectations.manage', 'group' => 'affectations'],
            ['name' => 'Saisir les présences', 'slug' => 'attendance.write', 'group' => 'attendance'],
            ['name' => 'Consulter les présences', 'slug' => 'attendance.read', 'group' => 'attendance'],
            ['name' => 'Saisir les notes', 'slug' => 'grades.write', 'group' => 'grades'],
            ['name' => 'Consulter les notes', 'slug' => 'grades.read', 'group' => 'grades'],
            ['name' => 'Gérer les stages', 'slug' => 'stages.manage', 'group' => 'stages'],
            ['name' => 'Consulter les feedbacks', 'slug' => 'feedbacks.read', 'group' => 'feedbacks'],
            ['name' => 'Consulter emploi du temps', 'slug' => 'timetable.read', 'group' => 'timetable'],
            ['name' => 'Gérer emploi du temps', 'slug' => 'timetable.manage', 'group' => 'timetable'],
            ['name' => 'Catalogue modules (lecture)', 'slug' => 'modules.read_catalog', 'group' => 'modules'],
            ['name' => 'Lire évaluations', 'slug' => 'evaluations.read', 'group' => 'grades'],
            ['name' => 'Gérer évaluations', 'slug' => 'evaluations.write', 'group' => 'grades'],
            ['name' => 'Exports données', 'slug' => 'exports.run', 'group' => 'exports'],
            ['name' => 'Tableaux de bord analytiques', 'slug' => 'analytics.read', 'group' => 'analytics'],
            ['name' => 'Assistant IA', 'slug' => 'ai.use', 'group' => 'ai'],
            ['name' => 'Messagerie', 'slug' => 'messages.use', 'group' => 'messages'],
            ['name' => 'Notifications', 'slug' => 'notifications.read', 'group' => 'notifications'],
            ['name' => 'Liaisons parent-stagiaires', 'slug' => 'admin.parent_links', 'group' => 'admin'],
            ['name' => 'Fichiers de cours (lecture)', 'slug' => 'course_files.read', 'group' => 'files'],
            ['name' => 'Progression (lecture)', 'slug' => 'progress.read', 'group' => 'progress'],
            ['name' => 'Tableau de bord', 'slug' => 'dashboard.read', 'group' => 'dashboard'],
            ['name' => 'Espace parent', 'slug' => 'parent.portal', 'group' => 'parent'],
            ['name' => 'Soumettre un avis', 'slug' => 'feedback.submit', 'group' => 'feedbacks'],
        ];

        foreach ($permissions as $permission) {
            Permission::updateOrCreate(['slug' => $permission['slug']], $permission);
        }

        // Setup permissions
        $adminRoles = Role::whereIn('slug', ['admin', 'directeur', 'secretariat'])->get();
        foreach ($adminRoles as $adminRole) {
            $adminRole->permissions()->sync(Permission::pluck('id'));
        }

        $teacherRoles = Role::whereIn('slug', ['teacher', 'formateur'])->get();
        foreach ($teacherRoles as $teacherRole) {
            $teacherRole->permissions()->sync(
                Permission::whereIn('slug', [
                    'attendance.write',
                    'attendance.read',
                    'grades.write',
                    'grades.read',
                    'modules.manage',
                    'affectations.manage',
                    'groups.read',
                    'stages.manage',
                    'timetable.read',
                    'timetable.manage',
                    'modules.read_catalog',
                    'evaluations.read',
                    'evaluations.write',
                    'exports.run',
                    'analytics.read',
                    'ai.use',
                    'messages.use',
                    'notifications.read',
                    'course_files.read',
                    'progress.read',
                    'dashboard.read',
                ])->pluck('id')
            );
        }

        $studentRoles = Role::whereIn('slug', ['student', 'stagiaire'])->get();
        $studentPermIds = Permission::whereIn('slug', [
            'grades.read',
            'groups.read',
            'timetable.read',
            'modules.read_catalog',
            'evaluations.read',
            'attendance.read',
            'course_files.read',
            'progress.read',
            'messages.use',
            'notifications.read',
            'dashboard.read',
            'feedback.submit',
        ])->pluck('id');
        foreach ($studentRoles as $r) {
            $r->permissions()->sync($studentPermIds);
        }

        $parentRole = Role::where('slug', 'parent')->first();
        if ($parentRole) {
            $parentRole->permissions()->sync(Permission::whereIn('slug', [
                'grades.read',
                'groups.read',
                'modules.read_catalog',
                'evaluations.read',
                'attendance.read',
                'course_files.read',
                'progress.read',
                'messages.use',
                'notifications.read',
                'dashboard.read',
                'analytics.read',
                'ai.use',
                'parent.portal',
                'feedback.submit',
            ])->pluck('id'));
        }
    }
}

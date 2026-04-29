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
            ['name' => 'Gérer les modules et syllabus', 'slug' => 'modules.manage', 'group' => 'modules'],
            ['name' => 'Gérer les affectations', 'slug' => 'affectations.manage', 'group' => 'affectations'],
            ['name' => 'Saisir les présences', 'slug' => 'attendance.write', 'group' => 'attendance'],
            ['name' => 'Consulter les présences', 'slug' => 'attendance.read', 'group' => 'attendance'],
            ['name' => 'Saisir les notes', 'slug' => 'grades.write', 'group' => 'grades'],
            ['name' => 'Consulter les notes', 'slug' => 'grades.read', 'group' => 'grades'],
            ['name' => 'Gérer les stages', 'slug' => 'stages.manage', 'group' => 'stages'],
            ['name' => 'Consulter les feedbacks', 'slug' => 'feedbacks.read', 'group' => 'feedbacks'],
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
                ])->pluck('id')
            );
        }
    }
}

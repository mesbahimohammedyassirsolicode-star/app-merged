<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')->where('role', 'formateur')->update(['role' => 'teacher']);
        DB::table('users')->where('role', 'stagiaire')->update(['role' => 'student']);

        $this->mergeRole('formateur', 'teacher', 'Teacher', 'Enseignant');
        $this->mergeRole('stagiaire', 'student', 'Student', 'Etudiant');
    }

    public function down(): void
    {
        DB::table('users')->where('role', 'teacher')->update(['role' => 'formateur']);
        DB::table('users')->where('role', 'student')->update(['role' => 'stagiaire']);

        $this->mergeRole('teacher', 'formateur', 'Formateur', 'Enseignant');
        $this->mergeRole('student', 'stagiaire', 'Stagiaire', 'Etudiant');
    }

    private function mergeRole(string $fromSlug, string $toSlug, string $toName, string $toDescription): void
    {
        $fromRole = DB::table('roles')->where('slug', $fromSlug)->first();
        $toRole = DB::table('roles')->where('slug', $toSlug)->first();

        if ($fromRole && $toRole) {
            $roleUsers = DB::table('role_user')
                ->where('role_id', $fromRole->id)
                ->pluck('user_id')
                ->map(fn ($id) => (int) $id)
                ->all();

            foreach ($roleUsers as $userId) {
                $exists = DB::table('role_user')
                    ->where('role_id', $toRole->id)
                    ->where('user_id', $userId)
                    ->exists();

                if (! $exists) {
                    DB::table('role_user')->insert([
                        'role_id' => $toRole->id,
                        'user_id' => $userId,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }

            DB::table('role_user')->where('role_id', $fromRole->id)->delete();

            $permissionIds = DB::table('permission_role')
                ->where('role_id', $fromRole->id)
                ->pluck('permission_id')
                ->map(fn ($id) => (int) $id)
                ->all();

            foreach ($permissionIds as $permissionId) {
                $exists = DB::table('permission_role')
                    ->where('role_id', $toRole->id)
                    ->where('permission_id', $permissionId)
                    ->exists();

                if (! $exists) {
                    DB::table('permission_role')->insert([
                        'role_id' => $toRole->id,
                        'permission_id' => $permissionId,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }

            DB::table('permission_role')->where('role_id', $fromRole->id)->delete();

            DB::table('roles')->where('id', $fromRole->id)->delete();

            return;
        }

        if ($fromRole) {
            DB::table('roles')
                ->where('id', $fromRole->id)
                ->update([
                    'slug' => $toSlug,
                    'name' => $toName,
                    'description' => $toDescription,
                    'updated_at' => now(),
                ]);

            return;
        }

        if (! $toRole) {
            DB::table('roles')->insert([
                'name' => $toName,
                'slug' => $toSlug,
                'description' => $toDescription,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
};

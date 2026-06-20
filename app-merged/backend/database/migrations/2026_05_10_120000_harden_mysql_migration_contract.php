<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->normalizeUsersRoleValues();
        $this->mergeLegacyRoleRows();
        $this->backfillCanonicalAssignmentTables();
        $this->normalizeAttendanceDatesAndStatuses();
        $this->addMissingIndexes();

        if (Schema::getConnection()->getDriverName() === 'mysql') {
            $this->convertUsersRoleEnumToVarchar();
            $this->addMissingForeignKeys();
        }
    }

    public function down(): void
    {
        // Intentionally no-op: this migration hardens the contract for MySQL cutover.
    }

    private function normalizeUsersRoleValues(): void
    {
        if (! Schema::hasTable('users') || ! Schema::hasColumn('users', 'role')) {
            return;
        }

        DB::table('users')->where('role', 'teacher')->update(['role' => 'formateur']);
        DB::table('users')->where('role', 'student')->update(['role' => 'stagiaire']);
    }

    private function mergeLegacyRoleRows(): void
    {
        if (! Schema::hasTable('roles')) {
            return;
        }

        $this->mergeRoleSlug('teacher', 'formateur', 'Formateur', 'Canonical trainer role');
        $this->mergeRoleSlug('student', 'stagiaire', 'Stagiaire', 'Canonical student role');
    }

    private function mergeRoleSlug(string $legacySlug, string $canonicalSlug, string $canonicalName, string $description): void
    {
        $legacy = DB::table('roles')->where('slug', $legacySlug)->first();
        $canonical = DB::table('roles')->where('slug', $canonicalSlug)->first();

        if (! $canonical) {
            $canonicalId = DB::table('roles')->insertGetId([
                'name' => $canonicalName,
                'slug' => $canonicalSlug,
                'description' => $description,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $canonical = (object) ['id' => $canonicalId];
        }

        if (! $legacy) {
            return;
        }

        if (Schema::hasTable('role_user')) {
            DB::table('role_user')
                ->where('role_id', $legacy->id)
                ->orderBy('user_id')
                ->get()
                ->each(function (object $row) use ($canonical): void {
                    $exists = DB::table('role_user')
                        ->where('role_id', $canonical->id)
                        ->where('user_id', $row->user_id)
                        ->exists();

                    if (! $exists) {
                        DB::table('role_user')
                            ->where('role_id', $row->role_id)
                            ->where('user_id', $row->user_id)
                            ->update(['role_id' => $canonical->id]);
                    } else {
                        DB::table('role_user')
                            ->where('role_id', $row->role_id)
                            ->where('user_id', $row->user_id)
                            ->delete();
                    }
                });
        }

        if (Schema::hasTable('permission_role')) {
            DB::table('permission_role')
                ->where('role_id', $legacy->id)
                ->orderBy('permission_id')
                ->get()
                ->each(function (object $row) use ($canonical): void {
                    $exists = DB::table('permission_role')
                        ->where('role_id', $canonical->id)
                        ->where('permission_id', $row->permission_id)
                        ->exists();

                    if (! $exists) {
                        DB::table('permission_role')
                            ->where('role_id', $row->role_id)
                            ->where('permission_id', $row->permission_id)
                            ->update(['role_id' => $canonical->id]);
                    } else {
                        DB::table('permission_role')
                            ->where('role_id', $row->role_id)
                            ->where('permission_id', $row->permission_id)
                            ->delete();
                    }
                });
        }

        DB::table('roles')->where('id', $legacy->id)->delete();
    }

    private function backfillCanonicalAssignmentTables(): void
    {
        if (Schema::hasTable('formateur_module') && Schema::hasTable('module_trainer')) {
            DB::table('formateur_module')
                ->orderBy('id')
                ->get(['user_id', 'module_id', 'created_at', 'updated_at'])
                ->each(function (object $row): void {
                    DB::table('module_trainer')->updateOrInsert(
                        ['user_id' => $row->user_id, 'module_id' => $row->module_id],
                        ['created_at' => $row->created_at ?? now(), 'updated_at' => $row->updated_at ?? now()]
                    );
                });
        }

        if (
            Schema::hasTable('teacher_module')
            && Schema::hasTable('module_trainer')
            && Schema::hasTable('formateurs')
        ) {
            DB::table('teacher_module as tm')
                ->join('formateurs as f', 'f.id', '=', 'tm.teacher_id')
                ->select('f.user_id', 'tm.module_id', 'tm.created_at', 'tm.updated_at')
                ->orderBy('tm.id')
                ->get()
                ->each(function (object $row): void {
                    if (! $row->user_id) {
                        return;
                    }

                    DB::table('module_trainer')->updateOrInsert(
                        ['user_id' => $row->user_id, 'module_id' => $row->module_id],
                        ['created_at' => $row->created_at ?? now(), 'updated_at' => $row->updated_at ?? now()]
                    );
                });
        }
    }

    private function normalizeAttendanceDatesAndStatuses(): void
    {
        if (! Schema::hasTable('attendances')) {
            return;
        }

        DB::table('attendances')->where('status', 'retard')->update(['status' => 'late']);

        DB::table('attendances')
            ->whereNotNull('date')
            ->orderBy('id')
            ->get(['id', 'date'])
            ->each(function (object $row): void {
                $normalizedDate = substr((string) $row->date, 0, 10);
                if ($normalizedDate === '' || $normalizedDate === $row->date) {
                    return;
                }

                DB::table('attendances')->where('id', $row->id)->update(['date' => $normalizedDate]);
            });
    }

    private function addMissingIndexes(): void
    {
        $this->addIndexIfMissing('attendances', 'idx_attendances_lookup', ['student_id', 'module_id', 'group_id', 'date']);
        $this->addIndexIfMissing('attendances', 'idx_attendances_teacher_date', ['teacher_id', 'date']);
        $this->addIndexIfMissing('seances', 'idx_seances_scope_date', ['user_id', 'module_id', 'groupe_id', 'date']);
        $this->addIndexIfMissing('evaluations', 'idx_evaluations_scope_date', ['user_id', 'module_id', 'groupe_id', 'date']);
        $this->addIndexIfMissing('progressions', 'idx_progressions_scope', ['user_id', 'module_id', 'groupe_id']);
        $this->addIndexIfMissing('module_trainer', 'idx_module_trainer_module_user', ['module_id', 'user_id']);
        $this->addIndexIfMissing('formateur_module_group', 'idx_fmg_module_group_user', ['module_id', 'groupe_id', 'user_id']);
        $this->addIndexIfMissing('parent_stagiaire', 'idx_parent_stagiaire_stagiaire_parent', ['stagiaire_id', 'parent_id']);
    }

    private function addIndexIfMissing(string $table, string $indexName, array $columns): void
    {
        if (! Schema::hasTable($table)) {
            return;
        }

        $indexes = Schema::getConnection()->getSchemaBuilder()->getIndexes($table);
        foreach ($indexes as $index) {
            if (($index['name'] ?? null) === $indexName) {
                return;
            }
        }

        Schema::table($table, function (Blueprint $table) use ($columns, $indexName): void {
            $table->index($columns, $indexName);
        });
    }

    private function convertUsersRoleEnumToVarchar(): void
    {
        if (! Schema::hasTable('users') || ! Schema::hasColumn('users', 'role')) {
            return;
        }

        DB::statement("ALTER TABLE users MODIFY role VARCHAR(32) NOT NULL DEFAULT 'stagiaire'");
    }

    private function addMissingForeignKeys(): void
    {
        $this->addMysqlForeignKey('seances', 'seances_user_id_foreign', 'user_id', 'users', 'id', 'SET NULL');
        $this->addMysqlForeignKey('seances', 'seances_module_id_foreign', 'module_id', 'modules', 'id', 'SET NULL');
        $this->addMysqlForeignKey('evaluations', 'evaluations_user_id_foreign', 'user_id', 'users', 'id', 'SET NULL');
        $this->addMysqlForeignKey('evaluations', 'evaluations_module_id_foreign', 'module_id', 'modules', 'id', 'SET NULL');
        $this->addMysqlForeignKey('evaluations', 'evaluations_groupe_id_foreign', 'groupe_id', 'groupes', 'id', 'SET NULL');
        $this->addMysqlForeignKey('progressions', 'progressions_user_id_foreign', 'user_id', 'users', 'id', 'SET NULL');
        $this->addMysqlForeignKey('progressions', 'progressions_module_id_foreign', 'module_id', 'modules', 'id', 'SET NULL');
        $this->addMysqlForeignKey('progressions', 'progressions_groupe_id_foreign', 'groupe_id', 'groupes', 'id', 'SET NULL');
    }

    private function addMysqlForeignKey(
        string $table,
        string $constraintName,
        string $column,
        string $referenceTable,
        string $referenceColumn,
        string $onDelete
    ): void {
        if (! Schema::hasTable($table) || ! Schema::hasColumn($table, $column)) {
            return;
        }

        $exists = DB::table('information_schema.table_constraints')
            ->where('constraint_schema', DB::raw('DATABASE()'))
            ->where('table_name', $table)
            ->where('constraint_name', $constraintName)
            ->exists();

        if ($exists) {
            return;
        }

        DB::statement(sprintf(
            'ALTER TABLE %s ADD CONSTRAINT %s FOREIGN KEY (%s) REFERENCES %s(%s) ON DELETE %s',
            $table,
            $constraintName,
            $column,
            $referenceTable,
            $referenceColumn,
            $onDelete
        ));
    }
};

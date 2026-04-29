<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('attendances')) {
            return;
        }

        Schema::table('attendances', function (Blueprint $table) {
            if (! Schema::hasColumn('attendances', 'student_id')) {
                $table->foreignId('student_id')->nullable()->after('id')->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('attendances', 'module_id')) {
                $table->foreignId('module_id')->nullable()->after('student_id')->constrained('modules')->nullOnDelete();
            }
            if (! Schema::hasColumn('attendances', 'group_id')) {
                $table->foreignId('group_id')->nullable()->after('module_id')->constrained('groupes')->nullOnDelete();
            }
            if (! Schema::hasColumn('attendances', 'teacher_id')) {
                $table->foreignId('teacher_id')->nullable()->after('group_id')->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('attendances', 'date')) {
                $table->date('date')->nullable()->after('teacher_id');
            }
            if (! Schema::hasColumn('attendances', 'minutes_late')) {
                $table->unsignedSmallInteger('minutes_late')->nullable()->after('status');
            }
            if (! Schema::hasColumn('attendances', 'note')) {
                $table->text('note')->nullable()->after('minutes_late');
            }
            if (! Schema::hasColumn('attendances', 'academic_year')) {
                $table->string('academic_year', 9)->nullable()->after('note');
            }
            if (! Schema::hasColumn('attendances', 'created_by')) {
                $table->foreignId('created_by')->nullable()->after('academic_year')->constrained('users')->nullOnDelete();
            }
        });

        if (Schema::hasColumn('attendances', 'status')) {
            // Legacy enum had "retard". Allow both, migrate values, then normalize to "late".
            DB::table('attendances')->where('status', 'retard')->update(['status' => 'late']);
            Schema::table('attendances', function (Blueprint $table) {
                $table->string('status')->default('present')->change();
            });
        }

        /*
        if (
            Schema::hasColumn('attendances', 'seance_id')
            && Schema::hasColumn('attendances', 'stagiaire_id')
            && Schema::hasTable('seances')
            && Schema::hasTable('stagiaires')
            && Schema::hasTable('affectations')
            && Schema::hasTable('formateurs')
            && Schema::getConnection()->getDriverName() === 'mysql'
        ) {
            DB::statement(<<<'SQL'
                UPDATE attendances a
                LEFT JOIN stagiaires st ON st.id = a.stagiaire_id
                LEFT JOIN seances s ON s.id = a.seance_id
                LEFT JOIN affectations af ON af.id = s.affectation_id
                LEFT JOIN formateurs f ON f.id = af.formateur_id
                SET
                    a.student_id = COALESCE(a.student_id, st.user_id),
                    a.module_id = COALESCE(a.module_id, af.module_id),
                    a.group_id = COALESCE(a.group_id, s.groupe_id, af.groupe_id),
                    a.teacher_id = COALESCE(a.teacher_id, f.user_id),
                    a.date = COALESCE(a.date, s.date),
                    a.minutes_late = COALESCE(a.minutes_late, a.retard_minutes),
                    a.note = COALESCE(a.note, a.motif),
                    a.academic_year = COALESCE(
                        a.academic_year,
                        CASE
                            WHEN COALESCE(a.date, s.date) IS NULL THEN NULL
                            WHEN MONTH(COALESCE(a.date, s.date)) >= 9
                                THEN CONCAT(YEAR(COALESCE(a.date, s.date)), '-', YEAR(COALESCE(a.date, s.date)) + 1)
                            ELSE CONCAT(YEAR(COALESCE(a.date, s.date)) - 1, '-', YEAR(COALESCE(a.date, s.date)))
                        END
                    ),
                    a.created_by = COALESCE(a.created_by, f.user_id)
            SQL);
        }
        */

        // Fallback for rows where we still don't have created_by.
        DB::table('attendances')
            ->whereNull('created_by')
            ->whereNotNull('teacher_id')
            ->update(['created_by' => DB::raw('teacher_id')]);

        $this->ensureIndex('attendances', 'idx_attendances_group_id', 'CREATE INDEX idx_attendances_group_id ON attendances (group_id)');
        $this->ensureIndex('attendances', 'idx_attendances_module_id', 'CREATE INDEX idx_attendances_module_id ON attendances (module_id)');
        $this->ensureIndex('attendances', 'idx_attendances_date', 'CREATE INDEX idx_attendances_date ON attendances (date)');
        $this->ensureIndex(
            'attendances',
            'attendance_unique_student_module_group_date_year',
            'CREATE UNIQUE INDEX attendance_unique_student_module_group_date_year ON attendances (student_id, module_id, group_id, date, academic_year)'
        );
    }

    public function down(): void
    {
        // Intentionally no-op: this migration is an alignment bridge from legacy schema.
    }

    private function ensureIndex(string $table, string $indexName, string $createSql): void
    {
        if (Schema::getConnection()->getDriverName() !== 'mysql') {
            try {
                DB::statement($createSql);
            } catch (Exception $e) {
                // Ignore if index exists
            }

            return;
        }

        $exists = DB::table('information_schema.statistics')
            ->whereRaw('table_schema = DATABASE()')
            ->where('table_name', $table)
            ->where('index_name', $indexName)
            ->exists();

        if (! $exists) {
            DB::statement($createSql);
        }
    }
};

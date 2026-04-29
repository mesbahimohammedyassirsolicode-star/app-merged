<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('teacher_module') && Schema::hasColumn('teacher_module', 'formateur_id')) {
            Schema::table('teacher_module', function (Blueprint $table) {
                $table->renameColumn('formateur_id', 'teacher_id');
                $table->renameColumn('annee_scolaire_id', 'academic_year');
            });

            if (Schema::getConnection()->getDriverName() === 'mysql') {
                $this->dropKeyIfExists('teacher_module', 'teacher_module_formateur_id_foreign');
                $this->dropKeyIfExists('teacher_module', 'teacher_module_annee_scolaire_id_foreign');
                $this->dropKeyIfExists('teacher_module', 'uq_teacher_module_scope');
                $this->dropKeyIfExists('teacher_module', 'idx_teacher_module_formateur_module');
                $this->dropKeyIfExists('teacher_module', 'idx_teacher_module_year_semester');

                DB::statement('ALTER TABLE teacher_module ADD CONSTRAINT teacher_module_teacher_id_foreign FOREIGN KEY (teacher_id) REFERENCES formateurs(id) ON DELETE CASCADE');
                DB::statement('ALTER TABLE teacher_module ADD CONSTRAINT teacher_module_academic_year_foreign FOREIGN KEY (academic_year) REFERENCES annees_scolaires(id) ON DELETE CASCADE');
                DB::statement('ALTER TABLE teacher_module ADD UNIQUE uq_teacher_module_scope (teacher_id, module_id, academic_year, semester)');
                DB::statement('ALTER TABLE teacher_module ADD INDEX idx_teacher_module_teacher_module (teacher_id, module_id)');
                DB::statement('ALTER TABLE teacher_module ADD INDEX idx_teacher_module_year_semester (academic_year, semester)');
            }
        }

        if (Schema::hasTable('module_groupe') && Schema::hasColumn('module_groupe', 'annee_scolaire_id')) {
            Schema::table('module_groupe', function (Blueprint $table) {
                $table->renameColumn('annee_scolaire_id', 'academic_year');
            });

            if (Schema::getConnection()->getDriverName() === 'mysql') {
                $this->dropKeyIfExists('module_groupe', 'module_groupe_annee_scolaire_id_foreign');
                $this->dropKeyIfExists('module_groupe', 'uq_module_groupe_scope');
                $this->dropKeyIfExists('module_groupe', 'idx_module_groupe_year_semester');

                DB::statement('ALTER TABLE module_groupe ADD CONSTRAINT module_groupe_academic_year_foreign FOREIGN KEY (academic_year) REFERENCES annees_scolaires(id) ON DELETE CASCADE');
                DB::statement('ALTER TABLE module_groupe ADD UNIQUE uq_module_groupe_scope (module_id, groupe_id, academic_year, semester)');
                DB::statement('ALTER TABLE module_groupe ADD INDEX idx_module_groupe_year_semester (academic_year, semester)');
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Intentionally left empty to avoid destructive rollback of production assignment data.
    }

    private function dropKeyIfExists(string $table, string $key): void
    {
        try {
            DB::statement("ALTER TABLE {$table} DROP FOREIGN KEY {$key}");

            return;
        } catch (Throwable) {
            // Ignore and try index drop.
        }

        try {
            DB::statement("ALTER TABLE {$table} DROP INDEX {$key}");
        } catch (Throwable) {
            // Ignore missing key.
        }
    }
};

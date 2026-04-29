<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Ensures seances.filiere_id is populated so filière-based filtering matches real timetables.
 * Safe to run multiple times (only fills NULLs). Skips joins when columns are missing.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('seances')) {
            return;
        }

        if (
            Schema::hasTable('groupes')
            && $this->tableHasColumn('groupes', 'filiere_id')
            && $this->tableHasColumn('seances', 'groupe_id')
        ) {
            $this->fillFromGroupeColumn();
        }

        if (
            Schema::hasTable('groupes')
            && Schema::hasTable('niveaux')
            && $this->tableHasColumn('groupes', 'niveau_id')
            && $this->tableHasColumn('niveaux', 'filiere_id')
            && $this->tableHasColumn('seances', 'groupe_id')
        ) {
            $this->fillFromGroupeNiveau();
        }

        if (
            Schema::hasTable('modules')
            && $this->tableHasColumn('modules', 'filiere_id')
            && $this->tableHasColumn('seances', 'module_id')
        ) {
            $this->fillFromModule();
        }

        $this->fillFromAffectationGroupe();
    }

    private function tableHasColumn(string $table, string $column): bool
    {
        if (! Schema::hasTable($table)) {
            return false;
        }

        return in_array($column, Schema::getColumnListing($table), true);
    }

    public function down(): void {}

    private function fillFromGroupeColumn(): void
    {
        // Correlated subquery: portable (SQLite cannot reference join aliases in UPDATE SET).
        DB::update('
            UPDATE seances
            SET filiere_id = (
                SELECT g.filiere_id FROM groupes g WHERE g.id = seances.groupe_id LIMIT 1
            )
            WHERE filiere_id IS NULL
            AND groupe_id IS NOT NULL
            AND EXISTS (
                SELECT 1 FROM groupes g2
                WHERE g2.id = seances.groupe_id AND g2.filiere_id IS NOT NULL
            )
        ');
    }

    private function fillFromGroupeNiveau(): void
    {
        DB::update('
            UPDATE seances
            SET filiere_id = (
                SELECT n.filiere_id
                FROM groupes g
                INNER JOIN niveaux n ON n.id = g.niveau_id
                WHERE g.id = seances.groupe_id
                AND n.filiere_id IS NOT NULL
                LIMIT 1
            )
            WHERE filiere_id IS NULL
            AND groupe_id IS NOT NULL
        ');
    }

    private function fillFromModule(): void
    {
        DB::update('
            UPDATE seances
            SET filiere_id = (
                SELECT m.filiere_id FROM modules m WHERE m.id = seances.module_id LIMIT 1
            )
            WHERE filiere_id IS NULL
            AND module_id IS NOT NULL
            AND EXISTS (
                SELECT 1 FROM modules m2
                WHERE m2.id = seances.module_id AND m2.filiere_id IS NOT NULL
            )
        ');
    }

    private function fillFromAffectationGroupe(): void
    {
        if (! Schema::hasTable('affectations') || ! $this->tableHasColumn('seances', 'affectation_id')) {
            return;
        }

        if (Schema::hasTable('groupes') && $this->tableHasColumn('groupes', 'filiere_id')) {
            DB::update('
                UPDATE seances
                SET filiere_id = (
                    SELECT g.filiere_id
                    FROM affectations a
                    INNER JOIN groupes g ON g.id = a.groupe_id
                    WHERE a.id = seances.affectation_id
                    LIMIT 1
                )
                WHERE filiere_id IS NULL
                AND affectation_id IS NOT NULL
            ');
        }

        if (
            Schema::hasTable('groupes')
            && Schema::hasTable('niveaux')
            && $this->tableHasColumn('groupes', 'niveau_id')
            && $this->tableHasColumn('niveaux', 'filiere_id')
        ) {
            DB::update('
                UPDATE seances
                SET filiere_id = (
                    SELECT n.filiere_id
                    FROM affectations a
                    INNER JOIN groupes g ON g.id = a.groupe_id
                    INNER JOIN niveaux n ON n.id = g.niveau_id
                    WHERE a.id = seances.affectation_id
                    AND n.filiere_id IS NOT NULL
                    LIMIT 1
                )
                WHERE filiere_id IS NULL
                AND affectation_id IS NOT NULL
            ');
        }
    }
};

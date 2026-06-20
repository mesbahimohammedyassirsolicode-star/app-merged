<?php

namespace App\Services;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use InvalidArgumentException;

class DatabaseMigrationAuditService
{
    public function sqlitePath(?string $path = null): string
    {
        $resolved = $path ?: (string) env('DB_SQLITE_DATABASE', database_path('database.sqlite'));

        if (! str_contains($resolved, ':') && ! str_starts_with($resolved, DIRECTORY_SEPARATOR)) {
            $resolved = base_path($resolved);
        }

        return $resolved;
    }

    public function auditSqlite(string $sqlitePath): array
    {
        if (! File::exists($sqlitePath)) {
            throw new InvalidArgumentException("SQLite database not found at [{$sqlitePath}].");
        }

        $source = $this->makeSqliteConnection($sqlitePath);
        $tables = collect($source->select("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"))
            ->pluck('name')
            ->values();

        return [
            'sqlite_path' => $sqlitePath,
            'tables' => $tables->all(),
            'row_counts' => $this->tableCounts($source, $tables),
            'users_role_distribution' => $this->keyValueCounts($source, 'SELECT role as value, COUNT(*) as aggregate FROM users GROUP BY role ORDER BY aggregate DESC'),
            'duplicate_checks' => $this->duplicateChecks($source),
            'orphan_checks' => $this->orphanChecks($source),
            'attendance_date_formats' => $this->attendanceDateFormats($source),
        ];
    }

    public function transferSqliteToMysql(
        string $sqlitePath,
        bool $dryRun = true,
        int $chunk = 500,
        bool $resolveAttendanceDuplicates = false
    ): array
    {
        if ($chunk < 1) {
            throw new InvalidArgumentException('Chunk size must be greater than zero.');
        }

        $source = $this->makeSqliteConnection($sqlitePath);
        $target = DB::connection('mysql');

        if ($target->getDriverName() !== 'mysql') {
            throw new InvalidArgumentException('Target connection [mysql] is not configured as MySQL.');
        }

        $orderedTables = [
            'annees_scolaires',
            'users',
            'roles',
            'permissions',
            'role_user',
            'permission_role',
            'administrators',
            'parents',
            'filieres',
            'niveaux',
            'groupes',
            'modules',
            'formateurs',
            'stagiaires',
            'groupe_stagiaire',
            'formateur_group',
            'formateur_module',
            'module_trainer',
            'formateur_module_group',
            'teacher_module',
            'module_groupe',
            'affectations',
            'seances',
            'evaluations',
            'notes',
            'syllabus_items',
            'progressions',
            'stages',
            'attendances',
            'absences',
            'feedbacks',
            'notifications',
            'messages',
            'audit_logs',
            'course_files',
            'products',
            'carts',
            'cart_items',
            'orders',
            'parent_stagiaire',
            'personal_access_tokens',
            'password_reset_tokens',
            'sessions',
            'cache',
            'cache_locks',
            'jobs',
            'job_batches',
            'failed_jobs',
            'migrations',
        ];

        $results = [];

        if ($dryRun) {
            foreach ($orderedTables as $table) {
                if (! $this->sourceTableExists($source, $table)) {
                    continue;
                }

                $results[$table] = [
                    'row_count' => (int) $source->table($table)->count(),
                    'status' => 'dry-run',
                ];
            }

            return $results;
        }

        $target->statement('SET FOREIGN_KEY_CHECKS=0');

        try {
            foreach ($orderedTables as $table) {
                if (! $this->sourceTableExists($source, $table) || ! $target->getSchemaBuilder()->hasTable($table)) {
                    continue;
                }

                $rows = $source->table($table)->orderBy($this->defaultOrderColumn($source, $table))->get();
                $preparedRows = $rows->map(fn (object $row) => $this->transformRowForTarget($table, (array) $row));

                if ($table === 'attendances' && $resolveAttendanceDuplicates) {
                    [$preparedRows, $dedupeLog] = $this->deduplicateAttendanceRows($preparedRows);
                    $results[$table]['deduplicated'] = $dedupeLog;
                }

                $conflicts = $this->detectConflicts($table, $preparedRows);
                if ($conflicts !== []) {
                    throw new InvalidArgumentException("Deterministic conflict detected for [{$table}]: ".json_encode($conflicts, JSON_UNESCAPED_UNICODE));
                }

                $target->table($table)->truncate();

                foreach ($preparedRows->chunk($chunk) as $chunkRows) {
                    $target->table($table)->insert($chunkRows->all());
                }

                $results[$table] = [
                    'row_count' => $preparedRows->count(),
                    'status' => 'imported',
                ];

                if (isset($dedupeLog)) {
                    $results[$table]['deduplicated'] = $dedupeLog;
                    unset($dedupeLog);
                }
            }
        } finally {
            $target->statement('SET FOREIGN_KEY_CHECKS=1');
        }

        return $results;
    }

    public function verifyTransfer(string $sqlitePath): array
    {
        $source = $this->makeSqliteConnection($sqlitePath);
        $target = DB::connection('mysql');
        $criticalTables = collect([
            'users',
            'formateurs',
            'stagiaires',
            'groupes',
            'modules',
            'seances',
            'attendances',
            'notes',
            'parent_stagiaire',
            'module_trainer',
            'formateur_module_group',
        ]);

        $counts = [];
        foreach ($criticalTables as $table) {
            $counts[$table] = [
                'sqlite' => $this->sourceTableExists($source, $table) ? (int) $source->table($table)->count() : null,
                'mysql' => $target->getSchemaBuilder()->hasTable($table) ? (int) $target->table($table)->count() : null,
            ];
        }

        return [
            'critical_counts' => $counts,
            'sqlite_role_distribution' => $this->keyValueCounts($source, 'SELECT role as value, COUNT(*) as aggregate FROM users GROUP BY role ORDER BY aggregate DESC'),
            'mysql_role_distribution' => $target->table('users')->selectRaw('role as value, COUNT(*) as aggregate')->groupBy('role')->orderByDesc('aggregate')->get()->map(fn (object $row) => ['value' => $row->value, 'aggregate' => (int) $row->aggregate])->all(),
            'mysql_orphan_checks' => $this->mysqlOrphanChecks($target),
            'mysql_attendance_duplicates' => $this->mysqlAttendanceDuplicates($target),
        ];
    }

    private function makeSqliteConnection(string $sqlitePath)
    {
        $connectionName = 'sqlite_migration_source';

        Config::set("database.connections.{$connectionName}", [
            'driver' => 'sqlite',
            'database' => $sqlitePath,
            'prefix' => '',
            'foreign_key_constraints' => true,
        ]);

        DB::purge($connectionName);

        return DB::connection($connectionName);
    }

    private function tableCounts($connection, Collection $tables): array
    {
        $counts = [];
        foreach ($tables as $table) {
            $counts[$table] = (int) $connection->table($table)->count();
        }

        return $counts;
    }

    private function keyValueCounts($connection, string $sql): array
    {
        return collect($connection->select($sql))
            ->map(fn (object $row) => ['value' => $row->value, 'aggregate' => (int) $row->aggregate])
            ->all();
    }

    private function duplicateChecks($connection): array
    {
        return [
            'users.email' => $this->queryRows($connection, 'SELECT email, COUNT(*) AS aggregate FROM users GROUP BY email HAVING COUNT(*) > 1'),
            'formateurs.matricule' => $this->queryRows($connection, 'SELECT matricule, COUNT(*) AS aggregate FROM formateurs GROUP BY matricule HAVING COUNT(*) > 1'),
            'stagiaires.cin' => $this->queryRows($connection, 'SELECT cin, COUNT(*) AS aggregate FROM stagiaires WHERE cin IS NOT NULL GROUP BY cin HAVING COUNT(*) > 1'),
            'stagiaires.cef_number' => $this->queryRows($connection, 'SELECT cef_number, COUNT(*) AS aggregate FROM stagiaires GROUP BY cef_number HAVING COUNT(*) > 1'),
            'attendances.semantic' => $this->queryRows($connection, "
                SELECT student_id, module_id, group_id, substr(date, 1, 10) AS normalized_date, academic_year, COUNT(*) AS aggregate
                FROM attendances
                GROUP BY student_id, module_id, group_id, substr(date, 1, 10), academic_year
                HAVING COUNT(*) > 1
            "),
        ];
    }

    private function orphanChecks($connection): array
    {
        return [
            'stagiaires.user_id' => $this->scalar($connection, 'SELECT COUNT(*) AS aggregate FROM stagiaires s LEFT JOIN users u ON u.id = s.user_id WHERE s.user_id IS NOT NULL AND u.id IS NULL'),
            'stagiaires.groupe_id' => $this->scalar($connection, 'SELECT COUNT(*) AS aggregate FROM stagiaires s LEFT JOIN groupes g ON g.id = s.groupe_id WHERE s.groupe_id IS NOT NULL AND g.id IS NULL'),
            'seances.user_id' => $this->scalar($connection, 'SELECT COUNT(*) AS aggregate FROM seances s LEFT JOIN users u ON u.id = s.user_id WHERE s.user_id IS NOT NULL AND u.id IS NULL'),
            'evaluations.module_id' => $this->scalar($connection, 'SELECT COUNT(*) AS aggregate FROM evaluations e LEFT JOIN modules m ON m.id = e.module_id WHERE e.module_id IS NOT NULL AND m.id IS NULL'),
            'progressions.groupe_id' => $this->scalar($connection, 'SELECT COUNT(*) AS aggregate FROM progressions p LEFT JOIN groupes g ON g.id = p.groupe_id WHERE p.groupe_id IS NOT NULL AND g.id IS NULL'),
            'parent_stagiaire.parent_id' => $this->scalar($connection, 'SELECT COUNT(*) AS aggregate FROM parent_stagiaire ps LEFT JOIN parents p ON p.id = ps.parent_id WHERE p.id IS NULL'),
        ];
    }

    private function attendanceDateFormats($connection): array
    {
        return collect($connection->select("
            SELECT
                CASE
                    WHEN date LIKE '____-__-__' THEN 'date_only'
                    WHEN date LIKE '____-__-__ __:__:__' THEN 'datetime_string'
                    ELSE 'other'
                END AS format_type,
                COUNT(*) AS aggregate
            FROM attendances
            WHERE date IS NOT NULL
            GROUP BY format_type
            ORDER BY aggregate DESC
        "))->map(fn (object $row) => ['format_type' => $row->format_type, 'aggregate' => (int) $row->aggregate])->all();
    }

    private function detectConflicts(string $table, Collection $rows): array
    {
        if ($table !== 'attendances') {
            return [];
        }

        $seen = [];
        $conflicts = [];

        foreach ($rows as $row) {
            $fingerprint = implode('|', [
                $row['student_id'] ?? 'null',
                $row['module_id'] ?? 'null',
                $row['group_id'] ?? 'null',
                $row['date'] ?? 'null',
                $row['academic_year'] ?? 'null',
            ]);

            if (isset($seen[$fingerprint])) {
                $conflicts[] = [
                    'type' => 'attendance_semantic_duplicate',
                    'first_id' => $seen[$fingerprint],
                    'duplicate_id' => $row['id'] ?? null,
                    'fingerprint' => $fingerprint,
                ];
                continue;
            }

            $seen[$fingerprint] = $row['id'] ?? null;
        }

        return $conflicts;
    }

    /**
     * @return array{0: Collection<int, array>, 1: array<int, array<string, mixed>>}
     */
    private function deduplicateAttendanceRows(Collection $rows): array
    {
        $deduplicated = [];
        $log = [];

        foreach ($rows as $row) {
            $fingerprint = implode('|', [
                $row['student_id'] ?? 'null',
                $row['module_id'] ?? 'null',
                $row['group_id'] ?? 'null',
                $row['date'] ?? 'null',
                $row['academic_year'] ?? 'null',
            ]);

            if (! isset($deduplicated[$fingerprint])) {
                $deduplicated[$fingerprint] = $row;
                continue;
            }

            $existing = $deduplicated[$fingerprint];
            $winner = $this->preferAttendanceRow($existing, $row);
            $loser = $winner === $existing ? $row : $existing;

            $deduplicated[$fingerprint] = $winner;
            $log[] = [
                'fingerprint' => $fingerprint,
                'kept_id' => $winner['id'] ?? null,
                'dropped_id' => $loser['id'] ?? null,
            ];
        }

        return [collect(array_values($deduplicated)), $log];
    }

    /**
     * Prefer the row with more relational context, then the higher id as the latest survivor.
     */
    private function preferAttendanceRow(array $left, array $right): array
    {
        $leftScore = $this->attendanceRowScore($left);
        $rightScore = $this->attendanceRowScore($right);

        if ($leftScore !== $rightScore) {
            return $leftScore > $rightScore ? $left : $right;
        }

        return (int) ($left['id'] ?? 0) >= (int) ($right['id'] ?? 0) ? $left : $right;
    }

    private function attendanceRowScore(array $row): int
    {
        $score = 0;
        foreach (['seance_id', 'stagiaire_id', 'student_id', 'module_id', 'group_id', 'teacher_id', 'created_by'] as $field) {
            if (! empty($row[$field])) {
                $score++;
            }
        }

        return $score;
    }

    private function transformRowForTarget(string $table, array $row): array
    {
        if ($table === 'users' && isset($row['role'])) {
            $row['role'] = match ($row['role']) {
                'teacher' => 'formateur',
                'student' => 'stagiaire',
                default => $row['role'],
            };
        }

        if ($table === 'attendances') {
            if (($row['status'] ?? null) === 'retard') {
                $row['status'] = 'late';
            }

            if (isset($row['date']) && $row['date'] !== null) {
                $row['date'] = substr((string) $row['date'], 0, 10);
            }
        }

        return $row;
    }

    private function mysqlOrphanChecks($connection): array
    {
        return [
            'seances.user_id' => (int) $connection->selectOne('SELECT COUNT(*) AS aggregate FROM seances s LEFT JOIN users u ON u.id = s.user_id WHERE s.user_id IS NOT NULL AND u.id IS NULL')->aggregate,
            'seances.module_id' => (int) $connection->selectOne('SELECT COUNT(*) AS aggregate FROM seances s LEFT JOIN modules m ON m.id = s.module_id WHERE s.module_id IS NOT NULL AND m.id IS NULL')->aggregate,
            'evaluations.groupe_id' => (int) $connection->selectOne('SELECT COUNT(*) AS aggregate FROM evaluations e LEFT JOIN groupes g ON g.id = e.groupe_id WHERE e.groupe_id IS NOT NULL AND g.id IS NULL')->aggregate,
            'progressions.groupe_id' => (int) $connection->selectOne('SELECT COUNT(*) AS aggregate FROM progressions p LEFT JOIN groupes g ON g.id = p.groupe_id WHERE p.groupe_id IS NOT NULL AND g.id IS NULL')->aggregate,
        ];
    }

    private function mysqlAttendanceDuplicates($connection): array
    {
        return collect($connection->select("
            SELECT student_id, module_id, group_id, date, academic_year, COUNT(*) AS aggregate
            FROM attendances
            GROUP BY student_id, module_id, group_id, date, academic_year
            HAVING COUNT(*) > 1
        "))->map(fn (object $row) => (array) $row)->all();
    }

    private function queryRows($connection, string $sql): array
    {
        return collect($connection->select($sql))
            ->map(fn (object $row) => (array) $row)
            ->values()
            ->all();
    }

    private function scalar($connection, string $sql): int
    {
        return (int) $connection->selectOne($sql)->aggregate;
    }

    private function sourceTableExists($connection, string $table): bool
    {
        return collect($connection->select("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?", [$table]))->isNotEmpty();
    }

    private function defaultOrderColumn($connection, string $table): string
    {
        $columns = collect($connection->select("PRAGMA table_info('{$table}')"))->pluck('name');

        return $columns->contains('id') ? 'id' : $columns->first();
    }
};

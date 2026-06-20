<?php

namespace App\Console\Commands;

use App\Services\DatabaseMigrationAuditService;
use Illuminate\Console\Command;

class AuditSqliteForMysqlCommand extends Command
{
    protected $signature = 'db:audit-sqlite-mysql
                            {--sqlite= : Path to the SQLite database file}';

    protected $description = 'Audit the current SQLite database before MySQL migration.';

    public function __construct(private DatabaseMigrationAuditService $auditService)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $report = $this->auditService->auditSqlite(
            $this->auditService->sqlitePath($this->option('sqlite'))
        );

        $this->info('SQLite -> MySQL audit summary');
        $this->newLine();
        $this->components->twoColumnDetail('SQLite file', $report['sqlite_path']);
        $this->components->twoColumnDetail('Tables discovered', (string) count($report['tables']));
        $this->newLine();
        $this->table(['Table', 'Rows'], collect($report['row_counts'])->map(fn ($count, $table) => [$table, $count])->all());
        $this->newLine();
        $this->table(['Role', 'Count'], collect($report['users_role_distribution'])->map(fn ($row) => [$row['value'], $row['aggregate']])->all());
        $this->newLine();
        $this->line(json_encode([
            'duplicate_checks' => $report['duplicate_checks'],
            'orphan_checks' => $report['orphan_checks'],
            'attendance_date_formats' => $report['attendance_date_formats'],
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        return self::SUCCESS;
    }
}

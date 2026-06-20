<?php

namespace App\Console\Commands;

use App\Services\DatabaseMigrationAuditService;
use Illuminate\Console\Command;

class VerifyMysqlMigrationCommand extends Command
{
    protected $signature = 'db:verify-mysql-migration
                            {--sqlite= : Path to the SQLite database file}';

    protected $description = 'Compare critical SQLite and MySQL tables after migration.';

    public function __construct(private DatabaseMigrationAuditService $auditService)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $report = $this->auditService->verifyTransfer(
            $this->auditService->sqlitePath($this->option('sqlite'))
        );

        $this->table(
            ['Table', 'SQLite', 'MySQL'],
            collect($report['critical_counts'])->map(fn ($row, $table) => [$table, $row['sqlite'], $row['mysql']])->values()->all()
        );
        $this->newLine();
        $this->line(json_encode([
            'sqlite_role_distribution' => $report['sqlite_role_distribution'],
            'mysql_role_distribution' => $report['mysql_role_distribution'],
            'mysql_orphan_checks' => $report['mysql_orphan_checks'],
            'mysql_attendance_duplicates' => $report['mysql_attendance_duplicates'],
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        return self::SUCCESS;
    }
}

<?php

namespace App\Console\Commands;

use App\Services\DatabaseMigrationAuditService;
use Illuminate\Console\Command;

class TransferSqliteToMysqlCommand extends Command
{
    protected $signature = 'db:transfer-sqlite-mysql
                            {--sqlite= : Path to the SQLite database file}
                            {--chunk=500 : Insert chunk size}
                            {--dry-run : Only inspect row counts without writing to MySQL}
                            {--resolve-attendance-duplicates : Deduplicate semantic attendance collisions and log them}';

    protected $description = 'Transfer SQLite data into the configured MySQL connection with preserved IDs.';

    public function __construct(private DatabaseMigrationAuditService $auditService)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $results = $this->auditService->transferSqliteToMysql(
            $this->auditService->sqlitePath($this->option('sqlite')),
            (bool) $this->option('dry-run'),
            (int) $this->option('chunk'),
            (bool) $this->option('resolve-attendance-duplicates')
        );

        $this->table(
            ['Table', 'Rows', 'Status'],
            collect($results)->map(fn ($row, $table) => [$table, $row['row_count'], $row['status']])->values()->all()
        );

        $attendanceLog = $results['attendances']['deduplicated'] ?? [];
        if ($attendanceLog !== []) {
            $this->newLine();
            $this->warn('Attendance duplicates were resolved during transfer:');
            $this->line(json_encode($attendanceLog, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        }

        return self::SUCCESS;
    }
}

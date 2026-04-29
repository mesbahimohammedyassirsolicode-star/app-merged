<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\QueryException;
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
        if (! Schema::hasTable('users') || ! Schema::hasColumn('users', 'email')) {
            return;
        }

        if ($this->indexExists('users', 'users_email_unique')) {
            return;
        }

        try {
            Schema::table('users', function (Blueprint $table) {
                $table->unique('email', 'users_email_unique');
            });
        } catch (QueryException $exception) {
            $errorInfo = $exception->errorInfo ?? [];
            $sqlState = (string) ($errorInfo[0] ?? '');
            $driverCode = (int) ($errorInfo[1] ?? 0);
            $message = strtolower($exception->getMessage());

            // MySQL:
            // - 1061 => duplicate key name (index already exists)
            // - 1062 => duplicate entry (legacy duplicate emails in data)
            if ($sqlState === '23000' && $driverCode === 1061) {
                return;
            }

            if ($sqlState === '23000' && $driverCode === 1062) {
                throw new \RuntimeException(
                    'Cannot apply unique index on users.email because duplicate email values exist. Clean duplicate rows first, then re-run migration.',
                    0,
                    $exception
                );
            }

            // SQLite: index already exists / duplicate data.
            if ($sqlState === 'HY000' && str_contains($message, 'index users_email_unique already exists')) {
                return;
            }

            if ($sqlState === '23000' && str_contains($message, 'unique constraint failed: users.email')) {
                throw new \RuntimeException(
                    'Cannot apply unique index on users.email because duplicate email values exist. Clean duplicate rows first, then re-run migration.',
                    0,
                    $exception
                );
            }

            throw $exception;
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasTable('users')) {
            return;
        }

        if (! $this->indexExists('users', 'users_email_unique')) {
            return;
        }

        try {
            Schema::table('users', function (Blueprint $table) {
                $table->dropUnique('users_email_unique');
            });
        } catch (QueryException $exception) {
            $errorInfo = $exception->errorInfo ?? [];
            $sqlState = (string) ($errorInfo[0] ?? '');
            $driverCode = (int) ($errorInfo[1] ?? 0);
            $message = strtolower($exception->getMessage());

            // MySQL 1091: can't drop; check that column/index exists.
            if ($sqlState === '42000' && $driverCode === 1091) {
                return;
            }

            // SQLite: no such index.
            if ($sqlState === 'HY000' && str_contains($message, 'no such index')) {
                return;
            }

            throw $exception;
        }
    }

    private function indexExists(string $table, string $indexName): bool
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'sqlite') {
            $indexes = DB::select("PRAGMA index_list('{$table}')");
            foreach ($indexes as $index) {
                $name = (string) ($index->name ?? '');
                if ($name === $indexName) {
                    return true;
                }
            }

            return false;
        }

        if ($driver === 'mysql') {
            $result = DB::select('SHOW INDEX FROM `'.$table.'` WHERE Key_name = ?', [$indexName]);

            return ! empty($result);
        }

        return false;
    }
};

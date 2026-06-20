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

        DB::table('attendances')->where('status', 'retard')->update(['status' => 'late']);

        if (Schema::hasColumn('attendances', 'minutes_late') && Schema::hasColumn('attendances', 'retard_minutes')) {
            DB::table('attendances')
                ->whereNull('minutes_late')
                ->where('retard_minutes', '>', 0)
                ->update(['minutes_late' => DB::raw('retard_minutes')]);

            DB::table('attendances')
                ->where('retard_minutes', 0)
                ->whereNotNull('minutes_late')
                ->update(['retard_minutes' => DB::raw('minutes_late')]);
        }

        $this->addIndexIfMissing('attendances', 'attendances_group_module_date_idx', ['group_id', 'module_id', 'date']);
        $this->addIndexIfMissing('attendances', 'attendances_seance_status_idx', ['seance_id', 'status']);
        $this->addIndexIfMissing('attendances', 'attendances_filiere_date_status_idx', ['filiere_id', 'date', 'status']);
    }

    public function down(): void
    {
        if (! Schema::hasTable('attendances')) {
            return;
        }

        Schema::table('attendances', function (Blueprint $table): void {
            $table->dropIndex('attendances_group_module_date_idx');
            $table->dropIndex('attendances_seance_status_idx');
            $table->dropIndex('attendances_filiere_date_status_idx');
        });
    }

    /**
     * @param  array<int, string>  $columns
     */
    private function addIndexIfMissing(string $table, string $indexName, array $columns): void
    {
        $schema = Schema::getConnection()->getSchemaBuilder();
        if (method_exists($schema, 'hasIndex') && $schema->hasIndex($table, $indexName)) {
            return;
        }

        Schema::table($table, function (Blueprint $blueprint) use ($columns, $indexName): void {
            $blueprint->index($columns, $indexName);
        });
    }
};

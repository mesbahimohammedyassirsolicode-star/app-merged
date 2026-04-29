<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('seances', function (Blueprint $table): void {
            $table->index(['date', 'start_time'], 'seances_date_start_idx');
            $table->index(['groupe_id', 'date', 'start_time'], 'seances_group_date_start_idx');
            $table->index(['status', 'date'], 'seances_status_date_idx');
        });
    }

    public function down(): void
    {
        Schema::table('seances', function (Blueprint $table): void {
            $table->dropIndex('seances_date_start_idx');
            $table->dropIndex('seances_group_date_start_idx');
            $table->dropIndex('seances_status_date_idx');
        });
    }
};

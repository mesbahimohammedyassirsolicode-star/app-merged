<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Add submission_token to existing feedbacks table (anonymous feedback – one-time token, no user/IP).
     */
    public function up(): void
    {
        if (Schema::hasColumn('feedbacks', 'submission_token')) {
            return;
        }
        Schema::table('feedbacks', function (Blueprint $table) {
            $table->string('submission_token', 64)->nullable()->unique()->after('id');
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('feedbacks', 'submission_token')) {
            return;
        }
        Schema::table('feedbacks', function (Blueprint $table) {
            $table->dropUnique(['submission_token']);
            $table->dropColumn('submission_token');
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('formateurs', function (Blueprint $table) {
            $table->foreignId('filiere_id')->nullable()->constrained('filieres')->onDelete('set null');
            $table->string('niveau', 10)->nullable(); // 1A, 2A
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('formateurs', function (Blueprint $table) {
            $table->dropForeign(['filiere_id']);
            $table->dropColumn(['filiere_id', 'niveau']);
        });
    }
};

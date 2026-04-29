<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Extend niveau_formation to support Bachelor and Master (private training centers).
     * Values: Q, T, TS, BACHELOR, MASTER
     */
    public function up(): void
    {
        if (Schema::hasColumn('stagiaires', 'niveau_formation')) {
            Schema::table('stagiaires', function (Blueprint $table) {
                $table->string('niveau_formation', 20)->default('TS')->change();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('stagiaires', 'niveau_formation')) {
            Schema::table('stagiaires', function (Blueprint $table) {
                $table->string('niveau_formation', 5)->default('TS')->change();
            });
        }
    }
};

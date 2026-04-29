<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * OFPPT eligibility: niveau_scolaire (educational level) + niveau_formation (Q/T/TS).
     */
    public function up(): void
    {
        Schema::table('stagiaires', function (Blueprint $table) {
            $table->string('niveau_scolaire', 20)->default('BAC')->after('date_naissance');
            $table->string('niveau_formation', 5)->default('TS')->after('niveau_scolaire');
        });
    }

    public function down(): void
    {
        Schema::table('stagiaires', function (Blueprint $table) {
            $table->dropColumn(['niveau_scolaire', 'niveau_formation']);
        });
    }
};

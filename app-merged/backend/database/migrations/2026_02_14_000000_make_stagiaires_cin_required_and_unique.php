<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Make CIN mandatory and unique for stagiaires (Moroccan school management).
     * Assigns placeholder CINs to existing null records before enforcing constraints.
     */
    public function up(): void
    {
        // Assign unique placeholder CINs for existing null records
        $stagiaires = DB::table('stagiaires')
            ->whereNull('cin')
            ->orWhere('cin', '')
            ->get();

        foreach ($stagiaires as $i => $s) {
            DB::table('stagiaires')
                ->where('id', $s->id)
                ->update(['cin' => 'XX'.str_pad((string) ($s->id + 100000), 6, '0', STR_PAD_LEFT)]);
        }

        Schema::table('stagiaires', function (Blueprint $table) {
            $table->string('cin', 20)->nullable(false)->change();
            $table->unique('cin');
        });
    }

    public function down(): void
    {
        Schema::table('stagiaires', function (Blueprint $table) {
            $table->dropUnique(['cin']);
            $table->string('cin', 20)->nullable()->change();
        });
    }
};

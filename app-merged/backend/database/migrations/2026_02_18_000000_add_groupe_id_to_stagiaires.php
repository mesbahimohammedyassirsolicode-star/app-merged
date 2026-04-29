<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stagiaires', function (Blueprint $table) {
            $table->foreignId('groupe_id')->nullable()->after('filiere_id')->constrained('groupes')->onDelete('restrict');
        });

        foreach (DB::table('groupe_stagiaire')->select('groupe_id', 'stagiaire_id')->get() as $row) {
            DB::table('stagiaires')->where('id', $row->stagiaire_id)->update(['groupe_id' => $row->groupe_id]);
        }
    }

    public function down(): void
    {
        Schema::table('stagiaires', function (Blueprint $table) {
            $table->dropForeign(['groupe_id']);
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('seances', function (Blueprint $table) {
            $table->foreignId('filiere_id')->nullable()->after('affectation_id')->constrained('filieres')->onDelete('cascade');
            $table->foreignId('groupe_id')->nullable()->after('filiere_id')->constrained('groupes')->onDelete('cascade');
        });

        $driver = DB::getDriverName();
        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            DB::statement('
                UPDATE seances s
                INNER JOIN affectations a ON s.affectation_id = a.id
                INNER JOIN groupes g ON a.groupe_id = g.id
                SET s.filiere_id = g.filiere_id, s.groupe_id = a.groupe_id
            ');
        } else {
            DB::table('seances')->whereNotNull('affectation_id')->get()->each(function ($row) {
                $a = DB::table('affectations')->where('id', $row->affectation_id)->first();
                if ($a) {
                    $g = DB::table('groupes')->where('id', $a->groupe_id)->first();
                    if ($g) {
                        DB::table('seances')->where('id', $row->id)->update([
                            'filiere_id' => $g->filiere_id,
                            'groupe_id' => $a->groupe_id,
                        ]);
                    }
                }
            });
        }
    }

    public function down(): void
    {
        Schema::table('seances', function (Blueprint $table) {
            $table->dropForeign(['filiere_id']);
            $table->dropForeign(['groupe_id']);
        });
    }
};

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
        // 1. Add columns to dependent tables conditionally
        Schema::table('seances', function (Blueprint $table) {
            if (! Schema::hasColumn('seances', 'user_id')) {
                $table->unsignedBigInteger('user_id')->nullable();
            }
            if (! Schema::hasColumn('seances', 'module_id')) {
                $table->unsignedBigInteger('module_id')->nullable();
            }
        });

        Schema::table('evaluations', function (Blueprint $table) {
            if (! Schema::hasColumn('evaluations', 'user_id')) {
                $table->unsignedBigInteger('user_id')->nullable();
            }
            if (! Schema::hasColumn('evaluations', 'module_id')) {
                $table->unsignedBigInteger('module_id')->nullable();
            }
            if (! Schema::hasColumn('evaluations', 'groupe_id')) {
                $table->unsignedBigInteger('groupe_id')->nullable();
            }
        });

        Schema::table('progressions', function (Blueprint $table) {
            if (! Schema::hasColumn('progressions', 'user_id')) {
                $table->unsignedBigInteger('user_id')->nullable();
            }
            if (! Schema::hasColumn('progressions', 'module_id')) {
                $table->unsignedBigInteger('module_id')->nullable();
            }
            if (! Schema::hasColumn('progressions', 'groupe_id')) {
                $table->unsignedBigInteger('groupe_id')->nullable();
            }
        });

        // 2. Data Migration
        if (Schema::hasTable('affectations')) {
            $affectations = DB::table('affectations')
                ->join('formateurs', 'affectations.formateur_id', '=', 'formateurs.id')
                ->select('affectations.*', 'formateurs.user_id as formateur_user_id')
                ->get();

            foreach ($affectations as $a) {
                DB::table('seances')->where('affectation_id', $a->id)->update([
                    'user_id' => $a->formateur_user_id,
                    'module_id' => $a->module_id,
                    'groupe_id' => $a->groupe_id,
                ]);

                DB::table('evaluations')->where('affectation_id', $a->id)->update([
                    'user_id' => $a->formateur_user_id,
                    'module_id' => $a->module_id,
                    'groupe_id' => $a->groupe_id,
                ]);

                DB::table('progressions')->where('affectation_id', $a->id)->update([
                    'user_id' => $a->formateur_user_id,
                    'module_id' => $a->module_id,
                    'groupe_id' => $a->groupe_id,
                ]);
            }
        }

        // 3. Keep legacy affectation columns/table for backward compatibility.
        // The new user_id/module_id/groupe_id columns are now the primary path used by
        // modern endpoints, but older seeders/tests/controllers still rely on the
        // affectations table during bootstrap.
    }

    public function down(): void
    {
        // Recovery logic would be complex here, usually not needed for this refactor
    }
};

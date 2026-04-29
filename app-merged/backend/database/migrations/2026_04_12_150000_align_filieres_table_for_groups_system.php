<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('filieres')) {
            Schema::create('filieres', function (Blueprint $table): void {
                $table->id();
                $table->string('code')->unique();
                $table->string('name');
                $table->string('label')->nullable();
                $table->timestamps();
            });

            return;
        }

        Schema::table('filieres', function (Blueprint $table): void {
            if (! Schema::hasColumn('filieres', 'name')) {
                $table->string('name')->nullable()->after('code');
            }

            if (! Schema::hasColumn('filieres', 'label')) {
                $table->string('label')->nullable()->after('name');
            }
        });

        $filieres = DB::table('filieres')
            ->select('id', 'code', 'name', 'label')
            ->get();

        foreach ($filieres as $filiere) {
            DB::table('filieres')
                ->where('id', $filiere->id)
                ->update([
                    'name' => $filiere->name ?: ($filiere->label ?: $filiere->code),
                    'label' => $filiere->label ?: ($filiere->name ?: $filiere->code),
                ]);
        }
    }

    public function down(): void {}
};

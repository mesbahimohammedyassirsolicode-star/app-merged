<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('parent_stagiaire', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parent_id')->constrained('parents')->cascadeOnDelete();
            $table->foreignId('stagiaire_id')->constrained('stagiaires')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['parent_id', 'stagiaire_id']);
        });

        // Migrate legacy stagiaires.parent_id → pivot (many parents per stagiaire supported going forward).
        $rows = DB::table('stagiaires')
            ->whereNotNull('parent_id')
            ->select('id', 'parent_id')
            ->get();

        $now = now();
        foreach ($rows as $row) {
            DB::table('parent_stagiaire')->insertOrIgnore([
                'parent_id' => $row->parent_id,
                'stagiaire_id' => $row->id,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('parent_stagiaire');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('module_trainer', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('module_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['user_id', 'module_id']);
        });

        if (Schema::hasTable('formateur_module')) {
            DB::table('formateur_module')
                ->select(['user_id', 'module_id', 'created_at', 'updated_at'])
                ->orderBy('id')
                ->get()
                ->each(function (object $row): void {
                    DB::table('module_trainer')->updateOrInsert(
                        [
                            'user_id' => (int) $row->user_id,
                            'module_id' => (int) $row->module_id,
                        ],
                        [
                            'created_at' => $row->created_at ?? now(),
                            'updated_at' => $row->updated_at ?? now(),
                        ]
                    );
                });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('module_trainer');
    }
};


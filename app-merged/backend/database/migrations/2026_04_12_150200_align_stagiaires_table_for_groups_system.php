<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('stagiaires')) {
            Schema::create('stagiaires', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('groupe_id')->constrained('groupes')->restrictOnDelete();
                $table->string('cef_number')->unique();
                $table->timestamps();
            });

            return;
        }

        Schema::table('stagiaires', function (Blueprint $table): void {
            if (! Schema::hasColumn('stagiaires', 'groupe_id')) {
                $table->foreignId('groupe_id')->nullable()->after('filiere_id')->constrained('groupes')->restrictOnDelete();
            }
        });
    }

    public function down(): void {}
};

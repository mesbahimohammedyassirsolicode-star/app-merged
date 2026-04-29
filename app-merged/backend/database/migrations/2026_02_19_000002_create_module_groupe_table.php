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
        Schema::create('module_groupe', function (Blueprint $table) {
            $table->id();
            $table->foreignId('module_id')->constrained('modules')->onDelete('cascade');
            $table->foreignId('groupe_id')->constrained('groupes')->onDelete('cascade');
            $table->foreignId('academic_year')->constrained('annees_scolaires')->onDelete('cascade');
            $table->enum('semester', ['S1', 'S2', 'S3', 'S4'])->nullable();
            $table->unsignedInteger('planned_hours')->nullable();
            $table->timestamps();

            $table->unique(
                ['module_id', 'groupe_id', 'academic_year', 'semester'],
                'uq_module_groupe_scope'
            );
            $table->index(['module_id', 'groupe_id'], 'idx_module_groupe_module_groupe');
            $table->index(['academic_year', 'semester'], 'idx_module_groupe_year_semester');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('module_groupe');
    }
};

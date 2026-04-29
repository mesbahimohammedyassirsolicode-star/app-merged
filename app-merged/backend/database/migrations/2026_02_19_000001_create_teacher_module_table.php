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
        Schema::create('teacher_module', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_id')->constrained('formateurs')->onDelete('cascade');
            $table->foreignId('module_id')->constrained('modules')->onDelete('cascade');
            $table->foreignId('academic_year')->constrained('annees_scolaires')->onDelete('cascade');
            $table->enum('semester', ['S1', 'S2', 'S3', 'S4'])->nullable();
            $table->unsignedInteger('weekly_hours')->nullable();
            $table->timestamps();

            $table->unique(
                ['teacher_id', 'module_id', 'academic_year', 'semester'],
                'uq_teacher_module_scope'
            );
            $table->index(['teacher_id', 'module_id'], 'idx_teacher_module_teacher_module');
            $table->index(['academic_year', 'semester'], 'idx_teacher_module_year_semester');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('teacher_module');
    }
};

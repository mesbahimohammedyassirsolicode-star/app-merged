<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Canonical attendance grid: one row per (seance, stagiaire) + backward compatible with V1
     */
    public function up(): void
    {
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            // [MERGED] V2 specific
            $table->foreignId('seance_id')->nullable()->constrained('seances')->onDelete('cascade');
            $table->foreignId('stagiaire_id')->nullable()->constrained('stagiaires')->onDelete('cascade');

            // [MERGED] V1 specific
            $table->foreignId('student_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->foreignId('module_id')->nullable()->constrained('modules')->cascadeOnDelete();
            $table->foreignId('group_id')->nullable()->constrained('groupes')->cascadeOnDelete();
            $table->foreignId('teacher_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->date('date')->nullable();
            $table->string('academic_year', 9)->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->cascadeOnDelete();

            // Combined status definition
            $table->enum('status', ['present', 'absent', 'late', 'retard'])->default('present');
            $table->unsignedSmallInteger('minutes_late')->nullable();
            $table->unsignedSmallInteger('retard_minutes')->default(0);

            // Text notes
            $table->text('note')->nullable();
            $table->boolean('justifie')->default(false);
            $table->string('motif', 255)->nullable();
            $table->string('justification_doc', 255)->nullable();

            $table->timestamps();

            // Indexes from V2
            $table->index(['stagiaire_id', 'seance_id']);
            $table->index(['stagiaire_id', 'status']);
            // Unique from V2
            $table->unique(['seance_id', 'stagiaire_id'], 'attendance_unique_seance_stagiaire');

            // Indexes/Uniques from V1
            $table->index('group_id');
            $table->index('module_id');
            $table->index('date');
            // This might fail if records overlap but is from V1
            $table->unique(['student_id', 'module_id', 'group_id', 'date', 'academic_year'], 'attendance_unique_student_module_group_date_year');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};

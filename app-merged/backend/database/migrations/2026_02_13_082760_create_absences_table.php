<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Must run after create_seances_table (FK to seances).
     */
    public function up(): void
    {
        Schema::create('absences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stagiaire_id')->constrained('stagiaires')->onDelete('cascade');
            $table->foreignId('seance_id')->constrained('seances')->onDelete('cascade');
            $table->boolean('justifie')->default(false);
            $table->integer('retard_minutes')->default(0);
            $table->string('motif')->nullable();
            $table->string('justification_doc')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('absences');
    }
};

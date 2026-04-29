<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Stage = internship (stage en entreprise) – OFPPT evaluation type.
     */
    public function up(): void
    {
        Schema::create('stages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stagiaire_id')->constrained('stagiaires')->onDelete('cascade');
            $table->foreignId('groupe_id')->nullable()->constrained('groupes')->onDelete('set null');
            $table->foreignId('formateur_id')->nullable()->constrained('formateurs')->onDelete('set null'); // tuteur pédagogique
            $table->string('organisation', 255);
            $table->string('poste', 150)->nullable();
            $table->date('date_debut');
            $table->date('date_fin');
            $table->enum('status', ['en_cours', 'valide', 'non_valide'])->default('en_cours');
            $table->text('rapport_path')->nullable();
            $table->decimal('note', 5, 2)->nullable();
            $table->text('observation')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::table('stages', function (Blueprint $table) {
            $table->index(['stagiaire_id', 'date_debut']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stages');
    }
};

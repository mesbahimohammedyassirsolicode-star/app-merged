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
        Schema::disableForeignKeyConstraints();

        Schema::dropIfExists('modules');
        Schema::dropIfExists('groupes');
        Schema::dropIfExists('groups');
        Schema::dropIfExists('niveaux');
        Schema::dropIfExists('filieres');

        Schema::create('filieres', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('niveau_id')->nullable();
            $table->string('code')->unique();
            $table->string('name');
            $table->string('label')->nullable();
            $table->string('type')->nullable();
            $table->string('required_level')->nullable();
            $table->integer('duration_years')->default(2);
            $table->string('description')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('niveaux', function (Blueprint $table) {
            $table->id();
            $table->foreignId('filiere_id')->nullable()->constrained('filieres')->nullOnDelete();
            $table->string('code')->nullable();
            $table->string('name');
            $table->string('label')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('groupes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('niveau_id')->nullable()->constrained('niveaux')->nullOnDelete();
            $table->foreignId('filiere_id')->nullable()->constrained('filieres')->nullOnDelete();
            $table->foreignId('annee_scolaire_id')->nullable()->constrained('annees_scolaires')->nullOnDelete();
            $table->string('name');
            $table->string('label')->nullable();
            $table->integer('year_level')->default(1);
            $table->integer('capacity')->default(30);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('modules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('niveau_id')->nullable()->constrained('niveaux')->nullOnDelete();
            $table->foreignId('filiere_id')->nullable()->constrained('filieres')->nullOnDelete();
            $table->string('code')->unique();
            $table->string('name');
            $table->string('label')->nullable();
            $table->integer('coefficient')->default(1);
            $table->integer('masse_horaire')->default(0);
            $table->enum('semester', ['S1', 'S2', 'S3', 'S4'])->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::enableForeignKeyConstraints();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::disableForeignKeyConstraints();
        Schema::dropIfExists('modules');
        Schema::dropIfExists('groupes');
        Schema::dropIfExists('niveaux');
        Schema::dropIfExists('filieres');
        Schema::enableForeignKeyConstraints();
    }
};

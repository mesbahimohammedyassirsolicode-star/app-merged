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
        Schema::dropIfExists('filieres');
        Schema::create('filieres', function (Blueprint $table) {
            $table->id();
            $table->foreignId('niveau_id')->nullable()->constrained('niveaux')->onDelete('cascade');
            $table->string('code')->unique();
            $table->string('label');
            $table->string('type')->nullable();
            $table->string('required_level')->nullable();
            $table->integer('duration_years')->default(2);
            $table->string('description')->nullable();
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
        Schema::dropIfExists('filieres');
    }
};

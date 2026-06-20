<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bus', function (Blueprint $table) {
            $table->id();
            $table->string('numero');
            $table->string('marque')->nullable();
            $table->integer('capacite')->nullable();
            $table->foreignId('chauffeur_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('zone')->nullable();
            $table->string('plaque')->nullable();
            $table->foreignId('school_id')->constrained('schools')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bus');
    }
};

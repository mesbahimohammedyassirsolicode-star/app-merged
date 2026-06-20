<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('incidents_transport', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bus_id')->constrained('bus')->onDelete('cascade');
            $table->date('date');
            $table->string('type')->nullable(); // Accident, Breakdown, Delay
            $table->text('description')->nullable();
            $table->string('statut')->default('signale'); // signale, en_cours, resolu
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('incidents_transport');
    }
};

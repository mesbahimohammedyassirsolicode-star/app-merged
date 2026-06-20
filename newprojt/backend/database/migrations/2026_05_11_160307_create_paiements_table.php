<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('paiements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('eleve_id')->constrained('eleves')->onDelete('cascade');
            $table->string('mois'); // e.g., "September 2024"
            $table->decimal('montant', 10, 2);
            $table->string('mode_paiement')->nullable(); // Cash, Check, Transfer
            $table->date('date_paiement')->nullable();
            $table->string('statut')->default('en_attente'); // payé, en_attente, retard
            $table->text('note')->nullable();
            $table->foreignId('school_id')->constrained('schools')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('paiements');
    }
};

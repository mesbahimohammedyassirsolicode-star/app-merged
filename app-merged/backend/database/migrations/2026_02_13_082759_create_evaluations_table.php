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
        Schema::create('evaluations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('affectation_id')->nullable()->constrained('affectations')->nullOnDelete();
            $table->string('item_label', 100);
            $table->enum('type', ['cc', 'efm', 'projet', 'stage']);
            $table->decimal('max_points', 5, 2)->default(20.00);
            $table->decimal('coefficient', 3, 2)->default(1.00);
            $table->date('date');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('evaluations');
    }
};

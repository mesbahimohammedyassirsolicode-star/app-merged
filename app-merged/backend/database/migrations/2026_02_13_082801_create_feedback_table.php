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
        Schema::create('feedbacks', function (Blueprint $table) {
            $table->id();
            $table->string('submission_token', 64)->nullable()->unique(); // one-time, no link to user/IP
            $table->enum('category', ['pedagogie', 'infrastructure', 'administration', 'autre'])->index();
            $table->text('content');
            $table->integer('sentiment_score')->nullable();
            $table->boolean('is_read')->default(false);
            $table->timestamps();
            $table->softDeletes();
        });
        // CRITICAL: No user_id, no IP. Anonymous feedback 100% untraceable.
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('feedbacks');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('analytics_conversations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title')->nullable();
            $table->string('scope_hash')->nullable();
            $table->json('context_snapshot')->nullable();
            $table->timestamps();
        });

        Schema::create('analytics_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained('analytics_conversations')->cascadeOnDelete();
            $table->string('role', 20);
            $table->text('message');
            $table->json('payload')->nullable();
            $table->json('context_snapshot')->nullable();
            $table->timestamps();

            $table->index(['conversation_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('analytics_messages');
        Schema::dropIfExists('analytics_conversations');
    }
};

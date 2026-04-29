<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Learning resources attached to a group (groupe) and/or a course module.
 * Files are stored on a private disk and streamed only after authorization.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('course_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('uploaded_by_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('groupe_id')->nullable()->constrained('groupes')->nullOnDelete();
            $table->foreignId('module_id')->nullable()->constrained('modules')->nullOnDelete();
            $table->string('title')->nullable();
            $table->text('description')->nullable();
            $table->string('original_name');
            $table->string('disk')->default('course_files');
            $table->string('path');
            $table->string('mime_type', 191);
            $table->unsignedBigInteger('size_bytes');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['groupe_id', 'module_id']);
            $table->index('module_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('course_files');
    }
};

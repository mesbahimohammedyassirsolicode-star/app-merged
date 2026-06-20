<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('analytics_daily_student_metrics', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('groupe_id')->nullable();
            $table->unsignedBigInteger('filiere_id')->nullable();
            $table->unsignedBigInteger('module_id')->nullable();
            $table->date('metric_date');
            $table->decimal('attendance_rate', 5, 2)->default(0);
            $table->unsignedInteger('absence_count')->default(0);
            $table->unsignedInteger('late_count')->default(0);
            $table->decimal('average_grade', 5, 2)->default(0);
            $table->decimal('pass_rate', 5, 2)->default(0);
            $table->decimal('risk_score', 5, 2)->default(0);
            $table->timestamps();

            $table->unique(['student_id', 'module_id', 'metric_date'], 'analytics_student_metric_unique');
            $table->index(['groupe_id', 'metric_date']);
            $table->index(['filiere_id', 'metric_date']);
        });

        Schema::create('analytics_daily_group_metrics', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('groupe_id');
            $table->unsignedBigInteger('filiere_id')->nullable();
            $table->unsignedBigInteger('module_id')->nullable();
            $table->date('metric_date');
            $table->unsignedInteger('student_count')->default(0);
            $table->decimal('attendance_rate', 5, 2)->default(0);
            $table->unsignedInteger('absence_count')->default(0);
            $table->unsignedInteger('late_count')->default(0);
            $table->decimal('average_grade', 5, 2)->default(0);
            $table->decimal('pass_rate', 5, 2)->default(0);
            $table->unsignedInteger('high_risk_count')->default(0);
            $table->timestamps();

            $table->unique(['groupe_id', 'module_id', 'metric_date'], 'analytics_group_metric_unique');
            $table->index(['filiere_id', 'metric_date']);
        });

        Schema::create('analytics_monthly_student_risk', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('groupe_id')->nullable();
            $table->unsignedBigInteger('filiere_id')->nullable();
            $table->string('month_key', 7);
            $table->decimal('risk_score', 5, 2)->default(0);
            $table->string('risk_level', 20)->default('low');
            $table->json('drivers')->nullable();
            $table->json('recommendations')->nullable();
            $table->timestamps();

            $table->unique(['student_id', 'month_key'], 'analytics_monthly_student_risk_unique');
            $table->index(['groupe_id', 'month_key']);
            $table->index(['filiere_id', 'month_key']);
            $table->index(['risk_level', 'month_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('analytics_monthly_student_risk');
        Schema::dropIfExists('analytics_daily_group_metrics');
        Schema::dropIfExists('analytics_daily_student_metrics');
    }
};

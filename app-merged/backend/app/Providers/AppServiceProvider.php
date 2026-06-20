<?php

namespace App\Providers;

use App\Models\Attendance;
use App\Models\Evaluation;
use App\Models\Module;
use App\Policies\AttendancePolicy;
use App\Policies\EvaluationPolicy;
use App\Policies\GradePolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void {}

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(Attendance::class, AttendancePolicy::class);
        Gate::policy(Evaluation::class, EvaluationPolicy::class);
        Gate::policy(Module::class, GradePolicy::class);
    }
}

<?php

namespace App\Strategies\Dashboard;

use App\Models\User;

interface DashboardStrategyInterface
{
    /**
     * Get the dashboard statistics and data based on the role strategy.
     */
    public function getDashboardData(User $user): array;
}

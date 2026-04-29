<?php

namespace App\Services;

use App\Models\User;
use App\Strategies\Dashboard\AdminStrategy;
use App\Strategies\Dashboard\DashboardStrategyInterface;
use App\Strategies\Dashboard\FormateurStrategy;
use App\Strategies\Dashboard\ParentStrategy;
use App\Strategies\Dashboard\StudentStrategy;
use Exception;

class DashboardService
{
    public function __construct(
        private AdminStrategy $adminStrategy,
        private FormateurStrategy $formateurStrategy,
        private StudentStrategy $studentStrategy,
        private ParentStrategy $parentStrategy
    ) {}

    /**
     * Resolve the appropriate strategy based on the user's role.
     *
     * @throws Exception
     */
    protected function resolveStrategy(string $role): DashboardStrategyInterface
    {
        return match ($role) {
            'admin', 'directeur', 'secretariat' => $this->adminStrategy,
            'teacher', 'formateur' => $this->formateurStrategy,
            'student', 'stagiaire' => $this->studentStrategy,
            'parent' => $this->parentStrategy,
            default => throw new Exception('Role not recognized for Dashboard.')
        };
    }

    /**
     * Get data for a user's dashboard based on their role.
     */
    public function getDashboardPayload(User $user, string $role): array
    {
        $strategy = $this->resolveStrategy($role);

        return $strategy->getDashboardData($user);
    }
}

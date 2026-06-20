<?php

namespace App\Console\Commands;

use App\Analytics\Aggregates\AnalyticsAggregateRefreshService;
use App\Analytics\Jobs\RefreshAnalyticsAggregatesJob;
use Illuminate\Console\Command;

class RefreshAnalyticsAggregatesCommand extends Command
{
    protected $signature = 'analytics:refresh-aggregates
                            {--date-from= : Start date in YYYY-MM-DD}
                            {--date-to= : End date in YYYY-MM-DD}
                            {--queue : Dispatch the refresh to the queue instead of running inline}';

    protected $description = 'Refresh analytics aggregate tables for the requested date range.';

    public function __construct(
        private AnalyticsAggregateRefreshService $refreshService
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $dateFrom = $this->option('date-from') ?: null;
        $dateTo = $this->option('date-to') ?: null;

        if ((bool) $this->option('queue')) {
            RefreshAnalyticsAggregatesJob::dispatch($dateFrom, $dateTo);
            $this->info('Analytics aggregate refresh has been queued.');

            return self::SUCCESS;
        }

        $result = $this->refreshService->refresh($dateFrom, $dateTo);

        $this->table(
            ['Date From', 'Date To', 'Student Daily', 'Group Daily', 'Monthly Risk'],
            [[
                $result['date_from'],
                $result['date_to'],
                $result['student_daily_count'],
                $result['group_daily_count'],
                $result['monthly_risk_count'],
            ]]
        );

        return self::SUCCESS;
    }
}

<?php

namespace App\Analytics\Jobs;

use App\Analytics\Aggregates\AnalyticsAggregateRefreshService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class RefreshAnalyticsAggregatesJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(
        public ?string $dateFrom = null,
        public ?string $dateTo = null
    ) {}

    public function handle(AnalyticsAggregateRefreshService $refreshService): void
    {
        $refreshService->refresh($this->dateFrom, $this->dateTo);
    }
}

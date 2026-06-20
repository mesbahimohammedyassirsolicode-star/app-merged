<?php

namespace App\Analytics\Catalog;

class AnalyticsCatalogService
{
    public function metrics(): array
    {
        return config('analytics.metrics', []);
    }

    public function dimensions(): array
    {
        return config('analytics.dimensions', []);
    }
}

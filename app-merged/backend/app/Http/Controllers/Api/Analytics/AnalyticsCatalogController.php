<?php

namespace App\Http\Controllers\Api\Analytics;

use App\Analytics\Catalog\AnalyticsCatalogService;
use App\Http\Controllers\Controller;

class AnalyticsCatalogController extends Controller
{
    public function __construct(
        private AnalyticsCatalogService $catalogService
    ) {}

    public function index()
    {
        return $this->success([
            'metrics' => $this->catalogService->metrics(),
            'dimensions' => $this->catalogService->dimensions(),
        ]);
    }
}

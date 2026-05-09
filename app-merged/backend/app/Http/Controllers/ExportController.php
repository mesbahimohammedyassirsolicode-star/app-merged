<?php

namespace App\Http\Controllers;

use App\Services\ExportService;

class ExportController extends Controller
{
    public function __construct(private ExportService $exportService) {}

    public function students()
    {
        return $this->exportService->studentsCsv();
    }

    public function modules()
    {
        return $this->exportService->modulesCsv();
    }

    public function grades()
    {
        return $this->exportService->gradesCsv();
    }
}

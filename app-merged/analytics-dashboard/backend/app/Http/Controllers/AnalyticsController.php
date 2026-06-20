<?php

namespace App\Http\Controllers;

use App\Http\Requests\AnalyticsFilterRequest;
use App\Models\AnalyticsRecord;
use Illuminate\Http\JsonResponse;

class AnalyticsController extends Controller
{
    public function index(AnalyticsFilterRequest $request): JsonResponse
    {
        $filters = $request->validated();
        
        $query = AnalyticsRecord::query();

        if (isset($filters['module_id'])) {
            $query->where('module_id', $filters['module_id']);
        }

        if (isset($filters['group_id'])) {
            $query->where('group_id', $filters['group_id']);
        }

        if (isset($filters['filiere_id'])) {
            $query->where('filiere_id', $filters['filiere_id']);
        }

        if (isset($filters['semester_id'])) {
            $query->where('semester_id', $filters['semester_id']);
        }

        if (isset($filters['date_start'])) {
            $query->where('created_at', '>=', $filters['date_start']);
        }

        if (isset($filters['date_end'])) {
            $query->where('created_at', '<=', $filters['date_end']);
        }

        $analyticsData = $query->get();

        return response()->json($analyticsData);
    }
}
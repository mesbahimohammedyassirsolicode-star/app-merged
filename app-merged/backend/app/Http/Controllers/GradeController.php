<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreGradeRequest;
use App\Services\GradeService;
use Illuminate\Http\Request;

class GradeController extends Controller
{
    public function __construct(private GradeService $gradeService) {}

    public function index(Request $request)
    {
        $validated = $request->validate([
            'module_id' => ['required', 'integer', 'exists:modules,id'],
            'groupe_id' => ['required', 'integer', 'exists:groupes,id'],
        ]);

        $rows = $this->gradeService->listByModuleAndGroup($request->user(), (int) $validated['module_id'], (int) $validated['groupe_id']);

        return $this->success($rows);
    }

    public function store(StoreGradeRequest $request)
    {
        $result = $this->gradeService->upsert($request->user(), $request->validated());

        return $this->success($result, [], 'Grade saved successfully.');
    }
}

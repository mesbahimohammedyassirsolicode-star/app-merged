<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTrainerGradesRequest;
use App\Http\Resources\TrainerGradeEntryFiliereResource;
use App\Models\Module;
use App\Services\TrainerGradeEntryService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class TrainerGradeEntryController extends Controller
{
    public function __construct(
        private readonly TrainerGradeEntryService $trainerGradeEntryService
    ) {}

    public function data(Request $request)
    {
        $trainerId = (int) $request->user()->id;
        $tree = $this->trainerGradeEntryService->getTrainerScopedTree($trainerId);

        return $this->success(TrainerGradeEntryFiliereResource::collection($tree));
    }

    public function store(StoreTrainerGradesRequest $request)
    {
        $payload = $request->validated();
        $entries = $this->normalizeEntries($payload);
        $trainerId = (int) $request->user()->id;

        foreach ($entries as $entry) {
            $module = Module::query()->findOrFail((int) $entry['module_id']);
            $this->authorize('update', $module);
        }

        $saved = $this->trainerGradeEntryService->saveBatch($trainerId, $entries);

        return $this->success($saved, [], 'Grades saved successfully.');
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<int, array{module_id:int,student_id:int,grade:float|int}>
     */
    private function normalizeEntries(array $payload): array
    {
        if (isset($payload['entries']) && is_array($payload['entries'])) {
            return array_map(
                fn ($entry) => [
                    'module_id' => (int) $entry['module_id'],
                    'student_id' => (int) $entry['student_id'],
                    'grade' => (float) $entry['grade'],
                ],
                $payload['entries']
            );
        }

        if (! isset($payload['module_id'], $payload['student_id'], $payload['grade'])) {
            throw ValidationException::withMessages([
                'entries' => ['Invalid payload. Use {module_id,student_id,grade} or entries[].'],
            ]);
        }

        return [[
            'module_id' => (int) $payload['module_id'],
            'student_id' => (int) $payload['student_id'],
            'grade' => (float) $payload['grade'],
        ]];
    }
}

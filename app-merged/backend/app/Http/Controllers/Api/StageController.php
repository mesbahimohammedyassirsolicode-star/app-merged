<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\StoreStageRequest;
use App\Http\Requests\UpdateStageRequest;
use App\Models\Stage;
use App\Services\ObjectScopeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class StageController extends BaseApiController
{
    public function __construct(
        private ObjectScopeService $objectScopeService
    ) {}

    public function index(Request $request)
    {
        $this->authorize('viewAny', Stage::class);

        $user = $request->user();
        $query = $this->objectScopeService->scopeStagesFor($user);

        if ($request->filled('stagiaire_id')) {
            $query->where('stagiaire_id', $request->stagiaire_id);
        }
        if ($request->filled('groupe_id')) {
            $query->where('groupe_id', $request->groupe_id);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        $perPage = min((int) $request->get('per_page', 15), 50);
        $paginator = $query->orderBy('date_debut', 'desc')->paginate($perPage);

        Log::info('security.stage.index', [
            'actor_id' => $user->id,
            'actor_role' => $user->role,
            'route' => 'api/v1/stages',
            'result_count' => count($paginator->items()),
            'total' => $paginator->total(),
            'status' => 'allow',
        ]);

        return $this->success($paginator->items(), [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
        ]);
    }

    public function store(StoreStageRequest $request)
    {
        $this->authorize('create', Stage::class);

        $validated = $request->validated();
        $this->objectScopeService->assertCanCreateStage($request->user(), $validated['formateur_id'] ?? null);
        $validated['status'] = $validated['status'] ?? 'en_cours';
        $stage = Stage::create($validated);
        return $this->created($stage->load(['stagiaire.user', 'groupe', 'formateur.user']));
    }

    public function show(Stage $stage)
    {
        $this->authorize('view', $stage);

        Log::info('security.stage.show', [
            'actor_id' => request()->user()?->id,
            'actor_role' => request()->user()?->role,
            'target_stage_id' => $stage->id,
            'status' => 'allow',
        ]);

        return $this->success($stage->load(['stagiaire.user', 'groupe', 'formateur.user']));
    }

    public function update(UpdateStageRequest $request, Stage $stage)
    {
        $this->authorize('update', $stage);

        $validated = $request->validated();
        $stage->update($validated);

        Log::warning('security.stage.update', [
            'actor_id' => $request->user()?->id,
            'actor_role' => $request->user()?->role,
            'target_stage_id' => $stage->id,
            'changed_keys' => array_keys($validated),
            'status' => 'allow',
        ]);

        return $this->success($stage->fresh(['stagiaire.user', 'groupe', 'formateur.user']));
    }

    public function destroy(Stage $stage)
    {
        $this->authorize('delete', $stage);

        Log::warning('security.stage.destroy', [
            'actor_id' => request()->user()?->id,
            'actor_role' => request()->user()?->role,
            'target_stage_id' => $stage->id,
            'status' => 'allow',
        ]);

        $stage->delete();
        return response()->json(null, 204);
    }
}

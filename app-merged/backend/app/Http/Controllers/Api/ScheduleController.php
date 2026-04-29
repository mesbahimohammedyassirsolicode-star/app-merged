<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\ScheduleIndexRequest;
use App\Http\Resources\ScheduleResource;
use App\Services\ScheduleService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class ScheduleController extends BaseApiController
{
    public function __construct(private readonly ScheduleService $scheduleService) {}

    public function index(ScheduleIndexRequest $request)
    {
        $filters = $request->validated();
        [$start, $end] = $this->resolveWeekRange($filters['week_start'] ?? null);
        $user = $request->user();

        if (! $user) {
            return $this->success($this->emptyPayload($start, $end));
        }

        $requestedGroupId = isset($filters['groupe_id']) ? (int) $filters['groupe_id'] : null;
        $requestedFiliereId = isset($filters['filiere_id']) ? (int) $filters['filiere_id'] : null;

        $groupScope = $this->resolveGroupScope($request, $requestedGroupId);
        $filiereScope = $this->resolveFiliereScope($request, $requestedFiliereId);

        $result = $this->scheduleService->fetchWeeklySchedules(
            $start,
            $end,
            $groupScope,
            $requestedGroupId,
            $filiereScope
        );

        $resourceRows = ScheduleResource::collection($result['rows'])->resolve();
        $byDate = collect($resourceRows)
            ->groupBy('date')
            ->map(fn (Collection $items) => $items->values()->all())
            ->toArray();

        return $this->success([
            'week_start' => (string) ($result['week_start'] ?? $start->toDateString()),
            'week_end' => (string) ($result['week_end'] ?? $end->toDateString()),
            'scope' => [
                'requested_groupe_id' => $requestedGroupId,
                'requested_filiere_id' => $requestedFiliereId,
                'effective_group_ids' => $groupScope->values()->all(),
                'effective_filiere_id' => $filiereScope,
            ],
            'schedules' => $resourceRows,
            'by_date' => $byDate,
        ]);
    }

    private function resolveWeekRange(?string $weekStart): array
    {
        try {
            $start = $weekStart
                ? Carbon::parse($weekStart)->startOfWeek(Carbon::MONDAY)->startOfDay()
                : Carbon::now()->startOfWeek(Carbon::MONDAY)->startOfDay();
        } catch (\Throwable) {
            $start = Carbon::now()->startOfWeek(Carbon::MONDAY)->startOfDay();
        }

        return [$start, $start->copy()->addDays(6)->endOfDay()];
    }

    private function emptyPayload(Carbon $start, Carbon $end): array
    {
        return [
            'week_start' => $start->toDateString(),
            'week_end' => $end->toDateString(),
            'scope' => [
                'requested_groupe_id' => null,
                'effective_group_ids' => [],
                'effective_filiere_id' => null,
            ],
            'schedules' => [],
            'by_date' => (object) [],
        ];
    }

    private function resolveGroupScope(Request $request, ?int $requestedGroupId): Collection
    {
        $user = $request->user();
        if (! $user) {
            return collect();
        }

        $role = (string) $user->role;
        $isStudent = in_array($role, ['student', 'stagiaire'], true);

        if ($isStudent) {
            $user->loadMissing('stagiaire.groupes');
            $stagiaire = $user->stagiaire;

            if (! $stagiaire) {
                return collect();
            }

            $filiereId = $stagiaire->getFiliereIdForScope();
            if ($filiereId === null) {
                return collect();
            }

            $groupIds = $stagiaire->getGroupeIdsInFiliere($filiereId);
            if ($groupIds->isEmpty() && $stagiaire->groupe_id) {
                $groupIds = collect([(int) $stagiaire->groupe_id]);
            }

            return $groupIds->map(fn ($id) => (int) $id)->unique()->values();
        }

        if ($requestedGroupId) {
            return collect([$requestedGroupId]);
        }

        return collect();
    }

    /**
     * When non-null, schedules are limited to this filière plus school-wide rows (filiere_id null).
     * Students are always scoped to their own filière regardless of the request param.
     * Staff can pass filiere_id explicitly to narrow the view.
     */
    private function resolveFiliereScope(Request $request, ?int $requestedFiliereId = null): ?int
    {
        $user = $request->user();
        if (! $user) {
            return null;
        }

        $role = (string) $user->role;

        if (! in_array($role, ['student', 'stagiaire'], true)) {
            return $requestedFiliereId;
        }

        $user->loadMissing('stagiaire.groupes', 'stagiaire.groupe.niveau');
        $stagiaire = $user->stagiaire;

        if (! $stagiaire) {
            return null;
        }

        $filiereId = $stagiaire->getFiliereIdForScope();

        return $filiereId !== null ? (int) $filiereId : null;
    }
}

<?php

namespace App\Services;

use App\Models\Groupe;
use App\Models\Seance;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ScheduleService
{
    /**
     * Full weekly query for a student/stagiaire: all sessions for their filière (by seance.filiere_id
     * and/or groupe belonging to that filière), plus school-wide rows (filiere_id null).
     */
    public function querySchedulesForStudentFiliere(int $filiereId): Builder
    {
        return $this->scopedScheduleQuery(collect(), $filiereId)
            ->orderBy('date')
            ->orderBy('start_time');
    }

    /**
     * Check whether a given room is already booked during the requested slot
     * (excluding the $exceptId seance when updating).
     */
    public function isRoomConflict(string $salle, string $date, string $startTime, string $endTime, ?int $exceptId = null): bool
    {
        if (empty($salle)) {
            return false;
        }

        return Seance::where('salle', $salle)
            ->where('date', $date)
            ->where('status', '!=', 'annule')
            ->where(function ($q) use ($startTime, $endTime) {
                // Overlap condition: not (end <= slot_start OR start >= slot_end)
                $q->where('start_time', '<', $endTime)
                    ->where('end_time', '>', $startTime);
            })
            ->when($exceptId, fn ($q) => $q->where('id', '!=', $exceptId))
            ->exists();
    }

    /**
     * Check whether a groupe is already scheduled for the same slot.
     */
    public function isGroupeConflict(int $groupeId, string $date, string $startTime, string $endTime, ?int $exceptId = null): bool
    {
        return Seance::where('groupe_id', $groupeId)
            ->where('date', $date)
            ->where('status', '!=', 'annule')
            ->where(function ($q) use ($startTime, $endTime) {
                $q->where('start_time', '<', $endTime)
                    ->where('end_time', '>', $startTime);
            })
            ->when($exceptId, fn ($q) => $q->where('id', '!=', $exceptId))
            ->exists();
    }

    /**
     * Resolve the filiere_id from the groupe.
     */
    public function resolveFiliereId(int $groupeId): ?int
    {
        $groupe = Groupe::find($groupeId);

        return $groupe?->filiere_id;
    }

    /**
     * Build the payload for creating or updating a Seance.
     * Separates business logic from the controller.
     */
    public function buildPayload(array $validated, int $userId): array
    {
        $groupeId = $validated['groupe_id'] ?? null;

        $filiereId = null;
        if ($groupeId) {
            $filiereId = $this->resolveFiliereId((int) $groupeId);
        } elseif (array_key_exists('filiere_id', $validated)) {
            $filiereId = $validated['filiere_id'] !== null && $validated['filiere_id'] !== ''
                ? (int) $validated['filiere_id']
                : null;
        }

        return array_filter([
            'user_id' => $validated['user_id'] ?? $userId,
            'module_id' => $validated['module_id'] ?? null,
            'groupe_id' => $groupeId,
            'filiere_id' => $filiereId,
            'date' => $validated['date'] ?? null,
            'start_time' => $validated['start_time'] ?? null,
            'end_time' => $validated['end_time'] ?? null,
            'salle' => $validated['salle'] ?? null,
            'type' => $validated['type'] ?? 'presentiel',
            'status' => $validated['status'] ?? 'planifie',
        ], fn ($v) => $v !== null);
    }

    /**
     * Create a Seance inside a transaction, with conflict checks.
     * Returns ['seance' => Seance] or ['error' => string].
     */
    public function create(array $payload): array
    {
        if (
            isset($payload['salle']) &&
            $this->isRoomConflict($payload['salle'], $payload['date'], $payload['start_time'], $payload['end_time'])
        ) {
            return ['error' => "La salle «{$payload['salle']}» est déjà réservée sur ce créneau."];
        }

        if (
            isset($payload['groupe_id']) &&
            $this->isGroupeConflict($payload['groupe_id'], $payload['date'], $payload['start_time'], $payload['end_time'])
        ) {
            return ['error' => 'Ce groupe a déjà une séance sur ce créneau.'];
        }

        $seance = DB::transaction(fn () => Seance::create($payload));

        return ['seance' => $seance];
    }

    /**
     * Update a Seance inside a transaction, with conflict checks.
     * Returns ['seance' => Seance] or ['error' => string].
     */
    public function update(Seance $seance, array $payload): array
    {
        $date = $payload['date'] ?? $seance->date;
        $startTime = $payload['start_time'] ?? $seance->start_time;
        $endTime = $payload['end_time'] ?? $seance->end_time;
        $salle = array_key_exists('salle', $payload) ? $payload['salle'] : $seance->salle;
        $groupeId = $payload['groupe_id'] ?? $seance->groupe_id;

        if (
            $salle &&
            $this->isRoomConflict($salle, $date, $startTime, $endTime, $seance->id)
        ) {
            return ['error' => "La salle «{$salle}» est déjà réservée sur ce créneau."];
        }

        if (
            $groupeId &&
            $this->isGroupeConflict($groupeId, $date, $startTime, $endTime, $seance->id)
        ) {
            return ['error' => 'Ce groupe a déjà une séance sur ce créneau.'];
        }

        DB::transaction(fn () => $seance->update($payload));

        return ['seance' => $seance->fresh()];
    }

    /**
     * Fetch schedules for a weekly range, including global and group-specific rows.
     * When a single group is requested, group rows override equivalent global rows.
     *
     * @return array{rows: Collection<int, Seance>, by_date: array<string, array<int, Seance>>}
     */
    public function fetchWeeklySchedules(
        Carbon $start,
        Carbon $end,
        Collection $groupScope,
        ?int $requestedGroupId = null,
        ?int $filiereScope = null
    ): array {
        $rows = $this->scopedScheduleQuery($groupScope, $filiereScope)
            ->whereBetween('date', [$start->toDateString(), $end->toDateString()])
            ->orderBy('date')
            ->orderBy('start_time')
            ->orderBy('id')
            ->get();

        if ($rows->isEmpty()) {
            // Fallback to the closest available week so UI doesn't show a false empty state
            // when historical/future planning exists outside the current week.
            $closestDate = $this->resolveClosestAvailableDate($groupScope, $start, $filiereScope);

            if ($closestDate !== null) {
                $start = $closestDate->copy()->startOfWeek(Carbon::MONDAY)->startOfDay();
                $end = $start->copy()->addDays(6)->endOfDay();

                $rows = $this->scopedScheduleQuery($groupScope, $filiereScope)
                    ->whereBetween('date', [$start->toDateString(), $end->toDateString()])
                    ->orderBy('date')
                    ->orderBy('start_time')
                    ->orderBy('id')
                    ->get();
            }
        }

        if ($requestedGroupId) {
            $rows = $this->deduplicateForGroup($rows, $requestedGroupId);
        }

        return [
            'rows' => $rows,
            'week_start' => $start->toDateString(),
            'week_end' => $end->toDateString(),
            'by_date' => $rows->groupBy(fn (Seance $row) => (string) $row->date)
                ->map(fn (Collection $items) => $items->values()->all())
                ->toArray(),
        ];
    }

    private function scopedScheduleQuery(Collection $groupScope, ?int $filiereScope = null): Builder
    {
        $with = [
            'module',
            'groupe',
            'filiere',
            'user',
            'affectation.module',
            'affectation.groupe',
            'affectation.formateur.user',
        ];

        if ($filiereScope !== null) {
            return Seance::query()
                ->with($with)
                ->where(function (Builder $f) use ($filiereScope) {
                    $f->whereNull('seances.filiere_id')
                        ->orWhere('seances.filiere_id', $filiereScope);
                })
                ->where(function (Builder $outer) use ($filiereScope) {
                    $outer
                        ->where(function (Builder $g) use ($filiereScope) {
                            $g->whereNotNull('seances.groupe_id')
                                ->whereHas('groupe', fn ($gq) => $this->applyGroupeBelongsToFiliere($gq, $filiereScope));
                        })
                        ->orWhere(function (Builder $g) {
                            $g->whereNull('seances.groupe_id')
                                ->whereDoesntHave('affectation');
                        })
                        ->orWhere(function (Builder $g) use ($filiereScope) {
                            $g->whereNull('seances.groupe_id')
                                ->whereHas('affectation.groupe', fn ($gq) => $this->applyGroupeBelongsToFiliere($gq, $filiereScope));
                        });
                });
        }

        return Seance::query()
            ->with($with)
            ->where(function ($q) use ($groupScope) {
                $q->whereNull('groupe_id');

                if ($groupScope->isNotEmpty()) {
                    $q->orWhereIn('groupe_id', $groupScope->all());
                }
            });
    }

    /**
     * Group belongs to filière via groupe.filiere_id or niveau.filiere_id.
     */
    private function applyGroupeBelongsToFiliere(Builder $groupeQuery, int $filiereScope): void
    {
        $groupeQuery->where(function ($q) use ($filiereScope) {
            $q->where('filiere_id', $filiereScope)
                ->orWhereHas('niveau', fn ($n) => $n->where('filiere_id', $filiereScope));
        });
    }

    private function resolveClosestAvailableDate(Collection $groupScope, Carbon $anchor, ?int $filiereScope = null): ?Carbon
    {
        $nextDate = (clone $this->scopedScheduleQuery($groupScope, $filiereScope))
            ->where('date', '>=', $anchor->toDateString())
            ->min('date');

        $prevDate = (clone $this->scopedScheduleQuery($groupScope, $filiereScope))
            ->where('date', '<', $anchor->toDateString())
            ->max('date');

        if ($nextDate === null && $prevDate === null) {
            return null;
        }

        if ($nextDate !== null && $prevDate === null) {
            return Carbon::parse($nextDate);
        }

        if ($prevDate !== null && $nextDate === null) {
            return Carbon::parse($prevDate);
        }

        $next = Carbon::parse((string) $nextDate);
        $prev = Carbon::parse((string) $prevDate);

        return $anchor->diffInDays($prev) <= $anchor->diffInDays($next) ? $prev : $next;
    }

    private function deduplicateForGroup(Collection $rows, int $groupId): Collection
    {
        $groupRows = $rows->where('groupe_id', $groupId)->values();
        $globalRows = $rows->whereNull('groupe_id')->values();

        $groupKeys = $groupRows
            ->mapWithKeys(fn (Seance $row) => [$this->slotKey($row) => true]);

        $filteredGlobal = $globalRows
            ->reject(fn (Seance $row) => $groupKeys->has($this->slotKey($row)));

        return $groupRows
            ->concat($filteredGlobal)
            ->sortBy([
                ['date', 'asc'],
                ['start_time', 'asc'],
                ['id', 'asc'],
            ])
            ->values();
    }

    private function slotKey(Seance $row): string
    {
        return implode('|', [
            (string) $row->date,
            (string) $row->start_time,
            (string) $row->end_time,
            (string) ($row->module_id ?? 0),
        ]);
    }
}

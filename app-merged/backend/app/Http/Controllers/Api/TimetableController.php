<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\StoreSeanceRequest;
use App\Http\Requests\UpdateSeanceRequest;
use App\Models\Seance;
use App\Services\ScheduleService;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class TimetableController extends BaseApiController
{
    public function __construct(private readonly ScheduleService $scheduleService) {}

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private function emptyPayload(Carbon $start, Carbon $end): array
    {
        return [
            'week_start' => $start->format('Y-m-d'),
            'week_end' => $end->format('Y-m-d'),
            'seances' => [],
            'by_date' => (object) [],
        ];
    }

    private function formatSeance(Seance $seance): array
    {
        $module = $seance->module ?? $seance->affectation?->module;
        $groupe = $seance->groupe ?? $seance->affectation?->groupe;
        $teacher = $seance->user?->name ?? $seance->affectation?->formateur?->user?->name;

        return [
            'id' => $seance->id,
            'date' => is_object($seance->date) ? $seance->date->format('Y-m-d') : (string) $seance->date,
            'start_time' => (string) $seance->start_time,
            'end_time' => (string) $seance->end_time,
            'salle' => $seance->salle,
            'status' => (string) $seance->status,
            'type' => (string) $seance->type,
            'user_id' => $seance->user_id,
            'module_id' => $seance->module_id,
            'groupe_id' => $seance->groupe_id,
            'filiere_id' => $seance->filiere_id,
            'module' => $module ? [
                'id' => $module->id,
                'code' => $module->code,
                'label' => $module->label,
            ] : null,
            'groupe' => $groupe ? [
                'id' => $groupe->id,
                'label' => $groupe->label,
            ] : null,
            'teacher' => $teacher ? ['name' => $teacher] : null,
        ];
    }

    private function baseQuery(): Builder
    {
        return Seance::query()
            ->with([
                'module',
                'groupe',
                'filiere',
                'user',
                'affectation.module',
                'affectation.groupe',
                'affectation.formateur.user',
            ])
            ->orderBy('date')
            ->orderBy('start_time');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // READ  GET /api/v1/timetable
    // ─────────────────────────────────────────────────────────────────────────

    public function index(Request $request)
    {
        try {
            $weekStart = $request->get('week_start');
            $date = $weekStart ? Carbon::parse($weekStart) : Carbon::now()->startOfWeek(Carbon::MONDAY);
            $start = $date->copy()->startOfDay();
            $end = $date->copy()->addDays(6)->endOfDay();
        } catch (\Throwable) {
            $start = Carbon::now()->startOfWeek(Carbon::MONDAY)->startOfDay();
            $end = $start->copy()->addDays(6)->endOfDay();

            return $this->success($this->emptyPayload($start, $end));
        }

        $user = $request->user();
        if (! $user) {
            return $this->success($this->emptyPayload($start, $end));
        }

        $query = $this->baseQuery();

        // ── Scope by role ────────────────────────────────────────────────────
        if ($this->isStudentRole($user->role)) {
            $user->loadMissing('stagiaire.groupe.niveau', 'stagiaire.groupes');
            $stagiaire = $user->stagiaire;
            if (! $stagiaire) {
                return $this->success($this->emptyPayload($start, $end));
            }
            $filiereId = $stagiaire->getFiliereIdForScope();
            if ($filiereId === null) {
                return $this->success($this->emptyPayload($start, $end));
            }
            $query = $this->scheduleService->querySchedulesForStudentFiliere($filiereId);
        } elseif ($this->isFormateurRole($user->role)) {
            // Formateur sees only their own scheduled sessions by default
            // unless they explicitly filter by groupe
            $query->where(function ($q) use ($user) {
                $q->where('seances.user_id', $user->id)
                    ->orWhereHas('affectation', fn ($a) => $a->whereHas('formateur', fn ($f) => $f->where('user_id', $user->id)));
            });

            if ($request->filled('groupe_id')) {
                $gid = (int) $request->groupe_id;
                $query->where(function ($q) use ($gid) {
                    $q->where('seances.groupe_id', $gid)
                        ->orWhereHas('affectation', fn ($a) => $a->where('groupe_id', $gid));
                });
            }
        } else {
            // Admin / secretariat / directeur — full access with optional filters
            if ($request->filled('groupe_id')) {
                $gid = (int) $request->groupe_id;
                $query->where(function ($q) use ($gid) {
                    $q->where('seances.groupe_id', $gid)
                        ->orWhereHas('affectation', fn ($a) => $a->where('groupe_id', $gid));
                });
            }

            if ($request->filled('formateur_id')) {
                $fid = (int) $request->formateur_id;
                $query->where(function ($q) use ($fid) {
                    $q->where('seances.user_id', $fid)
                        ->orWhereHas('affectation', fn ($aq) => $aq->where('formateur_id', $fid));
                });
            }
        }

        try {
            $allForScope = (clone $query)->get();
        } catch (\Throwable) {
            return $this->success($this->emptyPayload($start, $end));
        }
        $startStr = $start->format('Y-m-d');
        $endStr = $end->format('Y-m-d');

        $seancesForWeek = $allForScope->filter(function ($s) use ($startStr, $endStr) {
            $d = is_object($s->date) ? $s->date->format('Y-m-d') : (string) $s->date;

            return $d >= $startStr && $d <= $endStr;
        });
        // Auto-scroll to the first available week for students with no current sessions
        if ($this->isStudentRole($user->role) && $seancesForWeek->isEmpty() && $allForScope->isNotEmpty()) {
            $firstDate = $allForScope->min('date');
            if ($firstDate) {
                $d = Carbon::parse($firstDate);
                $start = $d->copy()->startOfWeek(Carbon::MONDAY)->startOfDay();
                $end = $start->copy()->addDays(6)->endOfDay();
                $startStr = $start->format('Y-m-d');
                $endStr = $end->format('Y-m-d');
                $seancesForWeek = $allForScope->filter(function ($s) use ($startStr, $endStr) {
                    $d = is_object($s->date) ? $s->date->format('Y-m-d') : (string) $s->date;

                    return $d >= $startStr && $d <= $endStr;
                });
            }
        }

        $seancesForWeek = $seancesForWeek->map(fn (Seance $s) => $this->formatSeance($s))->values();

        $byDate = $seancesForWeek
            ->groupBy(fn ($s) => (string) $s['date'])
            ->map(fn ($items) => $items->values()->all())
            ->toArray();

        return $this->success([
            'week_start' => $start->format('Y-m-d'),
            'week_end' => $end->format('Y-m-d'),
            'seances' => $seancesForWeek->all(),
            'by_date' => $byDate,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CREATE  POST /api/v1/timetable
    // ─────────────────────────────────────────────────────────────────────────

    public function store(StoreSeanceRequest $request)
    {
        $payload = $this->scheduleService->buildPayload(
            $request->validated(),
            $request->user()->id
        );

        $result = $this->scheduleService->create($payload);

        if (isset($result['error'])) {
            return $this->error($result['error'], 422);
        }

        $seance = $result['seance']->load(['module', 'groupe', 'filiere', 'user']);

        return $this->created($this->formatSeance($seance));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UPDATE  PUT /api/v1/timetable/{seance}
    // ─────────────────────────────────────────────────────────────────────────

    public function update(UpdateSeanceRequest $request, Seance $seance)
    {
        // Formateurs can only edit their own sessions
        if ($this->isFormateurRole($request->user()->role)) {
            if ((int) $seance->user_id !== (int) $request->user()->id) {
                return $this->error('Vous ne pouvez modifier que vos propres séances.', 403);
            }
        }

        $payload = $this->scheduleService->buildPayload(
            array_merge($seance->toArray(), $request->validated()),
            $seance->user_id ?? $request->user()->id
        );

        $result = $this->scheduleService->update($seance, $payload);

        if (isset($result['error'])) {
            return $this->error($result['error'], 422);
        }

        $fresh = $result['seance']->load(['module', 'groupe', 'filiere', 'user']);

        return $this->success($this->formatSeance($fresh));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DELETE  DELETE /api/v1/timetable/{seance}
    // ─────────────────────────────────────────────────────────────────────────

    public function destroy(Request $request, Seance $seance)
    {
        $role = $request->user()->role;

        if (! in_array($role, ['admin', 'directeur', 'secretariat', 'formateur', 'teacher'])) {
            return $this->error('Non autorisé.', 403);
        }

        // Formateurs can only delete their own sessions
        if ($this->isFormateurRole($role)) {
            if ((int) $seance->user_id !== (int) $request->user()->id) {
                return $this->error('Vous ne pouvez supprimer que vos propres séances.', 403);
            }
        }

        $seance->delete();

        return response()->json(null, 204);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────────

    private function isStudentRole(?string $role): bool
    {
        return $role === 'student' || $role === 'stagiaire';
    }

    private function isFormateurRole(?string $role): bool
    {
        return $role === 'formateur' || $role === 'teacher';
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Absence;
use App\Models\Attendance;
use App\Models\AuditLog;
use App\Models\Groupe;
use App\Models\Seance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AttendanceController extends Controller
{
    /** @return array{0: int, 1: int} */
    private function resolveSeanceModuleAndGroupIds(Seance $seance): array
    {
        $moduleId = (int) ($seance->module_id ?? $seance->affectation?->module_id ?? 0);
        $groupId = (int) ($seance->groupe_id ?? $seance->affectation?->groupe_id ?? 0);
        if ($moduleId <= 0 || $groupId <= 0) {
            abort(422, 'Seance sans module ou groupe.');
        }

        return [$moduleId, $groupId];
    }

    private function ensureLegacyAttendanceAdmin(Request $request): void
    {
        if (($request->user()?->role ?? null) !== 'admin') {
            abort(403, 'Legacy seance attendance endpoints are restricted to admin.');
        }
    }

    public function index(Request $request)
    {
        $this->authorize('viewAny', Attendance::class);

        $query = Seance::with([
            'module',
            'groupe',
            'user',
            'affectation.module',
            'affectation.groupe',
            'affectation.formateur.user',
        ]);
        $user = $request->user();
        if (in_array((string) ($user?->role ?? ''), ['teacher', 'formateur'], true)) {
            // Align with TimetableController: sessions may be keyed by user_id/module_id/groupe_id
            // without a resolved affectation row.
            $query->where(function ($q) use ($user) {
                $q->where('seances.user_id', $user->id)
                    ->orWhereHas(
                        'affectation',
                        fn ($a) => $a->whereHas('formateur', fn ($f) => $f->where('user_id', $user->id))
                    );
            });
        }
        // ... rest of index
        if ($request->has('groupe_id')) {
            $gid = (int) $request->groupe_id;
            $query->where(function ($q) use ($gid) {
                $q->where('seances.groupe_id', $gid)
                    ->orWhereHas('affectation', fn ($a) => $a->where('groupe_id', $gid));
            });
        }
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('date', [$request->start_date, $request->end_date]);
        }
        $perPage = min((int) $request->get('per_page', 15), 50);
        $paginator = $query->orderBy('date')->orderBy('start_time')->paginate($perPage);

        return $this->success($paginator->items(), [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
        ]);
    }

    public function show(Request $request, Seance $seance)
    {
        $user = $request->user();
        if (in_array((string) ($user?->role ?? ''), ['teacher', 'formateur'], true)) {
            $ownsByUser = (int) ($seance->user_id ?? 0) === (int) $user->id;
            $ownsByAffectation = $seance->affectation()
                ->whereHas('formateur', fn ($q) => $q->where('user_id', $user->id))
                ->exists();
            if (! $ownsByUser && ! $ownsByAffectation) {
                abort(403, 'Acces refuse a cette seance.');
            }
        } else {
            $this->ensureLegacyAttendanceAdmin($request);
        }

        return $this->success($seance->load([
            'module',
            'groupe',
            'user',
            'affectation.module',
            'affectation.groupe',
            'affectation.formateur.user',
        ]));
    }

    public function store(Request $request)
    {
        $this->ensureLegacyAttendanceAdmin($request);

        $validated = $request->validate([
            'affectation_id' => 'required|exists:affectations,id',
            'date' => 'required|date',
            'start_time' => 'required',
            'end_time' => 'required|after:start_time',
            'salle' => 'nullable|string',
            'type' => 'in:presentiel,distance',
        ]);
        $seance = Seance::create($validated);

        return $this->created($seance->load('affectation'));
    }

    /**
     * Update Seance.
     */
    public function update(Request $request, Seance $seance)
    {
        $this->ensureLegacyAttendanceAdmin($request);

        $validated = $request->validate([
            'date' => 'date',
            'start_time' => 'required',
            'end_time' => 'after:start_time',
            'status' => 'in:planifie,realise,annule',
            'salle' => 'string',
        ]);

        $seance->update($validated);

        return $this->success($seance->fresh());
    }

    public function destroy(Request $request, Seance $seance)
    {
        $this->ensureLegacyAttendanceAdmin($request);
        $seance->delete();

        return response()->json(null, 204);
    }

    /** Canonical roll call using attendances table (one row per stagiaire per seance). */
    public function getRollCall(Request $request, Seance $seance)
    {
        [$moduleId, $groupId] = $this->resolveSeanceModuleAndGroupIds($seance);
        $this->authorize('markSession', [Attendance::class, $moduleId, $groupId]);

        $seance->loadMissing(['groupe', 'affectation.groupe']);
        $groupe = $seance->groupe ?? $seance->affectation?->groupe;
        if (! $groupe) {
            $groupe = Groupe::query()->find($groupId);
        }
        if (! $groupe) {
            abort(422, 'Groupe introuvable pour cette seance.');
        }
        $stagiaires = $groupe->stagiaires()->with('user')->get();
        $attendances = $seance->attendances()->get()->keyBy('stagiaire_id');
        $rows = $stagiaires->map(fn ($s) => [
            'stagiaire' => $s,
            'attendance' => $attendances->get($s->id),
            'status' => $attendances->get($s->id)?->status ?? 'present',
        ]);

        return $this->success($rows);
    }

    public function submitRollCall(Request $request, Seance $seance)
    {
        [$moduleId, $groupId] = $this->resolveSeanceModuleAndGroupIds($seance);
        $this->authorize('markSession', [Attendance::class, $moduleId, $groupId]);

        $validated = $request->validate([
            'attendances' => 'required|array',
            'attendances.*.stagiaire_id' => 'required|exists:stagiaires,id',
            'attendances.*.status' => 'required|in:present,absent,retard',
            'attendances.*.retard_minutes' => 'nullable|integer|min:0',
            'attendances.*.justifie' => 'nullable|boolean',
            'attendances.*.motif' => 'nullable|string|max:255',
        ]);
        DB::transaction(function () use ($seance, $validated) {
            foreach ($validated['attendances'] as $row) {
                Attendance::updateOrCreate(
                    ['seance_id' => $seance->id, 'stagiaire_id' => $row['stagiaire_id']],
                    [
                        'status' => $row['status'],
                        'retard_minutes' => $row['retard_minutes'] ?? 0,
                        'justifie' => $row['justifie'] ?? false,
                        'motif' => $row['motif'] ?? null,
                    ]
                );
            }
            if ($seance->status === 'planifie') {
                $seance->update(['status' => 'realise']);
            }
        });
        AuditLog::log('attendance.mark', Seance::class, $seance->id, null, ['count' => count($validated['attendances'])]);

        return $this->success(['message' => 'Présences enregistrées.']);
    }

    // --- Legacy Absences (optional) ---

    /**
     * Get absences for a specific seance (Roll call view).
     */
    public function getAbsencesForSeance(Request $request, Seance $seance)
    {
        $this->ensureLegacyAttendanceAdmin($request);

        // Return list of students in the group with their absence status for this seance
        // If absence record exists, return it. If not, they are present.

        $groupe = $seance->affectation->groupe;
        $stagiaires = $groupe->stagiaires()->get();

        $absences = $seance->absences()->get()->keyBy('stagiaire_id');

        $data = $stagiaires->map(fn ($s) => [
            'stagiaire' => $s->load('user'),
            'is_absent' => (bool) $absences->get($s->id),
            'absence_details' => $absences->get($s->id),
        ]);

        return $this->success($data->values()->all());
    }

    /**
     * Mark absences for a seance (Submit Roll Call).
     */
    public function markAbsences(Request $request, Seance $seance)
    {
        $this->ensureLegacyAttendanceAdmin($request);

        $validated = $request->validate([
            'absences' => 'required|array',
            'absences.*.stagiaire_id' => 'required|exists:stagiaires,id',
            'absences.*.is_absent' => 'required|boolean',
            'absences.*.retard_minutes' => 'nullable|integer',
            'absences.*.motif' => 'nullable|string',
        ]);

        DB::transaction(function () use ($seance, $validated) {
            foreach ($validated['absences'] as $record) {
                if ($record['is_absent'] || ($record['retard_minutes'] ?? 0) > 0) {
                    Absence::updateOrCreate(
                        ['seance_id' => $seance->id, 'stagiaire_id' => $record['stagiaire_id']],
                        [
                            'justifie' => false, // Default unless justification provided
                            'retard_minutes' => $record['retard_minutes'] ?? 0,
                            'motif' => $record['motif'] ?? null,
                        ]
                    );
                } else {
                    // If marked present, remove any existing absence record
                    Absence::where('seance_id', $seance->id)
                        ->where('stagiaire_id', $record['stagiaire_id'])
                        ->delete();
                }
            }

            // Mark seance as 'realise' logic could go here if needed
            if ($seance->status === 'planifie') {
                $seance->update(['status' => 'realise']);
            }
        });

        AuditLog::log('attendance.mark_legacy', Seance::class, $seance->id, null, ['count' => count($validated['absences'])]);

        return $this->success(['message' => 'Absences enregistrées.']);
    }

    /**
     * Update specific absence (e.g., Justification).
     */
    public function updateAbsence(Request $request, Absence $absence)
    {
        $validated = $request->validate([
            'justifie' => 'boolean',
            'motif' => 'nullable|string',
            'justification_doc' => 'nullable|string', // Path to uploaded file
        ]);

        $absence->update($validated);

        return $this->success($absence->fresh());
    }
}

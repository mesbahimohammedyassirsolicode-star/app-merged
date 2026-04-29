<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Evaluation;
use App\Models\Note;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EvaluationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Evaluation::query()->with(['module', 'groupe']);

        $this->applyOwnershipScope($query, $user);

        if ($request->has('module_id')) {
            $query->where('module_id', (int) $request->module_id);
        }
        if ($request->has('groupe_id')) {
            $query->where('groupe_id', (int) $request->groupe_id);
        }

        $perPage = min((int) $request->get('per_page', 15), 50);
        $paginator = $query->orderBy('date', 'desc')->paginate($perPage);

        return $this->success($paginator->items(), [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
        ]);
    }

    public function store(Request $request)
    {
        // FIXED: Authorize against Evaluation, not Note — we are creating an Evaluation here.
        $this->authorize('create', Evaluation::class);

        $validated = $request->validate([
            'module_id' => 'required|exists:modules,id',
            'groupe_id' => 'required|exists:groupes,id',
            'user_id' => 'required|exists:users,id',
            'item_label' => 'required|string|max:100',
            'type' => 'required|in:cc,efm,projet,stage',
            'max_points' => 'required|numeric|min:0',
            'coefficient' => 'required|numeric|min:0',
            'date' => 'required|date',
        ]);

        $evaluation = Evaluation::create($validated);

        return $this->created($evaluation->load(['module', 'groupe']));
    }

    public function show(Request $request, Evaluation $evaluation)
    {
        $user = $request->user();
        $this->assertCanViewEvaluation($user, $evaluation);

        $evaluation->load(['module', 'groupe']);
        $notesQuery = $evaluation->notes()->with('stagiaire.user');

        if ($user->role === 'student' || $user->role === 'stagiaire') {
            $stagiaireId = (int) ($user->stagiaire?->id ?? 0);
            $notesQuery->where('stagiaire_id', $stagiaireId);
        } elseif ($user->role === 'parent') {
            $childIds = $this->linkedChildIds($user);
            $notesQuery->whereIn('stagiaire_id', $childIds);
        }

        $evaluation->setRelation('notes', $notesQuery->get());

        return $this->success($evaluation);
    }

    public function update(Request $request, Evaluation $evaluation)
    {
        $this->authorize('update', $evaluation);

        $validated = $request->validate([
            'item_label' => 'string|max:100',
            'max_points' => 'numeric|min:0',
            'coefficient' => 'numeric|min:0',
            'date' => 'date',
        ]);

        $evaluation->update($validated);

        return $this->success($evaluation->fresh());
    }

    public function destroy(Request $request, Evaluation $evaluation)
    {
        $this->authorize('delete', $evaluation);
        $evaluation->delete();

        return response()->json(null, 204);
    }

    public function getNotes(Request $request, Evaluation $evaluation)
    {
        $this->assertTeacherOwnsEvaluationWhenTeacher($request->user(), $evaluation);

        $groupe = $evaluation->groupe;
        $stagiaires = $groupe->stagiaires()->with('user')->get();
        $notes = $evaluation->notes()->get()->keyBy('stagiaire_id');
        $data = $stagiaires->map(fn ($s) => [
            'stagiaire' => $s,
            'note' => $notes->get($s->id),
            'max_points' => $evaluation->max_points,
        ]);

        return $this->success($data->values()->all());
    }

    public function saveNotes(Request $request, Evaluation $evaluation)
    {
        $this->authorize('update', $evaluation);

        $validated = $request->validate([
            'notes' => 'required|array',
            'notes.*.stagiaire_id' => 'required|exists:stagiaires,id',
            'notes.*.valeur' => 'required|numeric|min:0|max:'.$evaluation->max_points,
            'notes.*.observation' => 'nullable|string',
        ]);

        DB::transaction(function () use ($evaluation, $validated) {
            foreach ($validated['notes'] as $noteData) {
                Note::updateOrCreate(
                    ['evaluation_id' => $evaluation->id, 'stagiaire_id' => $noteData['stagiaire_id']],
                    [
                        'valeur' => $noteData['valeur'],
                        'observation' => $noteData['observation'] ?? null,
                    ]
                );
            }
        });

        // Audit simplified
        AuditLog::log('grades.bulk_save', Evaluation::class, $evaluation->id, null, ['count' => count($validated['notes'])]);

        return $this->success(['message' => 'Notes enregistrees.']);
    }

    private function applyOwnershipScope($query, User $user): void
    {
        if ($user->role === 'admin' || $user->role === 'directeur' || $user->role === 'secretariat') {
            return;
        }

        if ($user->role === 'teacher' || $user->role === 'formateur') {
            $query->where('user_id', $user->id);

            return;
        }

        if ($user->role === 'student' || $user->role === 'stagiaire') {
            $stagiaireId = (int) ($user->stagiaire?->id ?? 0);
            if ($stagiaireId <= 0) {
                $query->whereRaw('0 = 1');

                return;
            }

            $query->whereHas('notes', fn ($q) => $q->where('stagiaire_id', $stagiaireId));

            return;
        }

        if ($user->role === 'parent') {
            $childIds = $this->linkedChildIds($user);
            if (empty($childIds)) {
                $query->whereRaw('0 = 1');

                return;
            }

            $query->whereHas('notes', fn ($q) => $q->whereIn('stagiaire_id', $childIds));

            return;
        }

        abort(403, 'Role non autorise.');
    }

    private function linkedChildIds(User $user): array
    {
        return $user->parent?->children()->pluck('stagiaires.id')->map(fn ($id) => (int) $id)->all() ?? [];
    }

    private function assertCanViewEvaluation(User $user, Evaluation $evaluation): void
    {
        if ($user->role === 'admin' || $user->role === 'directeur' || $user->role === 'secretariat') {
            return;
        }

        if ($user->role === 'teacher' || $user->role === 'formateur') {
            $this->assertTeacherOwnsEvaluationWhenTeacher($user, $evaluation);

            return;
        }

        if ($user->role === 'student' || $user->role === 'stagiaire') {
            $stagiaireId = (int) ($user->stagiaire?->id ?? 0);
            $canView = $stagiaireId > 0 && $evaluation->notes()->where('stagiaire_id', $stagiaireId)->exists();
            if (! $canView) {
                abort(403, 'Acces refuse a cette evaluation.');
            }

            return;
        }

        if ($user->role === 'parent') {
            $childIds = $this->linkedChildIds($user);
            $canView = ! empty($childIds) && $evaluation->notes()->whereIn('stagiaire_id', $childIds)->exists();
            if (! $canView) {
                abort(403, 'Acces refuse a cette evaluation.');
            }

            return;
        }

        abort(403, 'Role non autorise.');
    }

    private function assertTeacherOwnsEvaluationWhenTeacher(User $user, Evaluation $evaluation): void
    {
        if (! in_array($user->role, ['teacher', 'formateur'])) {
            return;
        }

        if ((int) $evaluation->user_id !== (int) $user->id) {
            abort(403, 'Acces refuse a cette evaluation.');
        }
    }
}

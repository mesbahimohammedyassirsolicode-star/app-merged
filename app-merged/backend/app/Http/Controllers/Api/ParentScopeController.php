<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\AdminLinkParentStagiairesRequest;
use App\Http\Requests\LinkParentStagiairesRequest;
use App\Models\Absence;
use App\Models\Attendance;
use App\Models\Note;
use App\Models\Seance;
use App\Models\Stagiaire;
use App\Models\StudentParent;
use App\Services\ParentStagiaireDenormalizeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Parent-scoped API: parents can only access their own children's data.
 */
class ParentScopeController extends BaseApiController
{
    public function __construct(
        private ParentStagiaireDenormalizeService $parentStagiaireDenormalize
    ) {}

    /**
     * Own stagiaires only — query scoped to Auth user's parent profile.
     */
    public function children(Request $request)
    {
        return $this->parentStagiaires($request);
    }

    /**
     * Alias for clients expecting /parent/stagiaires — same authorization as children().
     */
    public function stagiaires(Request $request)
    {
        $parent = $request->user()->parent;
        if (! $parent) {
            return $this->error('Profil parent non trouve.', 403);
        }

        $stagiaires = $parent->stagiaires()
            ->with([
                'user:id,name,email',
                'filiere:id,code,name,label',
                'filiere.modules:id,filiere_id,code,label,name',
                'groupe:id,name,label',
            ])
            ->orderBy('id')
            ->get()
            ->map(function (Stagiaire $stagiaire) {
                $moduleNames = $stagiaire->filiere?->modules
                    ? $stagiaire->filiere->modules
                        ->map(fn ($module) => $module->label ?? $module->name ?? $module->code)
                        ->filter()
                        ->values()
                        ->all()
                    : [];

                return [
                    'id' => (int) $stagiaire->id,
                    'name' => $stagiaire->user?->name,
                    'filiere' => $stagiaire->filiere?->label ?? $stagiaire->filiere?->name ?? $stagiaire->filiere?->code,
                    'groupe' => $stagiaire->groupe?->label ?? $stagiaire->groupe?->name,
                    'modules' => $moduleNames,
                ];
            })
            ->values()
            ->all();

        return $this->success([
            'stagiaires' => $stagiaires,
        ]);
    }

    private function parentStagiaires(Request $request)
    {
        $parent = $request->user()->parent;
        if (! $parent) {
            return $this->error('Profil parent non trouve.', 403);
        }

        $children = $parent->stagiaires()
            ->with(['user:id,name,email', 'filiere:id,code,name,label', 'groupe:id,name,label', 'groupes.filiere'])
            ->orderBy('id')
            ->get();

        return $this->success($children);
    }

    /**
     * Full stagiaire list for linking UI — authenticated parent only.
     */
    public function linkableStagiaires(Request $request)
    {
        $parent = $request->user()->parent;
        if (! $parent) {
            return $this->error('Profil parent non trouve.', 403);
        }

        $stagiaires = Stagiaire::query()
            ->with(['user:id,name,email', 'filiere:id,code,label', 'groupe:id,name,label'])
            ->orderBy('id')
            ->get();

        $pivotByStagiaire = DB::table('parent_stagiaire')
            ->whereIn('stagiaire_id', $stagiaires->pluck('id'))
            ->get()
            ->groupBy('stagiaire_id');

        $parentId = (int) $parent->id;

        $payload = $stagiaires->map(function (Stagiaire $s) use ($pivotByStagiaire, $parentId) {
            $rows = collect($pivotByStagiaire->get($s->id, collect()));
            $linkedToMe = $rows->contains(fn ($r) => (int) $r->parent_id === $parentId);
            $hasOtherParents = $rows->contains(fn ($r) => (int) $r->parent_id !== $parentId);

            return [
                'id' => $s->id,
                'cef_number' => $s->cef_number,
                'status' => $s->status,
                'user' => $s->user ? ['name' => $s->user->name, 'email' => $s->user->email] : null,
                'filiere' => $s->filiere ? ['label' => $s->filiere->label ?? $s->filiere->code] : null,
                'groupe' => $s->groupe ? ['label' => $s->groupe->label ?? $s->groupe->name] : null,
                'linked_to_me' => $linkedToMe,
                'has_other_parents' => $hasOtherParents,
            ];
        });

        return $this->success($payload->values()->all());
    }

    /**
     * Sync pivot parent_stagiaire for this parent (replaces previous selection for this account).
     */
    public function linkStagiaires(LinkParentStagiairesRequest $request)
    {
        $parent = $request->user()->parent;
        if (! $parent) {
            return $this->error('Profil parent non trouve.', 403);
        }

        /** @var list<int> $ids */
        $ids = array_map('intval', $request->validated('stagiaire_ids'));

        $before = $parent->stagiaires()->get()->pluck('id')->map(fn ($id) => (int) $id)->all();

        DB::transaction(function () use ($parent, $ids, $before): void {
            $parent->stagiaires()->sync($ids);
            $touched = array_values(array_unique(array_merge($before, $ids)));
            $this->parentStagiaireDenormalize->syncForStagiaireIds($touched);
        });

        return $this->success([
            'linked_ids' => array_values($ids),
            'count' => count($ids),
        ], [], 'Liens enregistrés.');
    }

    public function grades(Request $request, Stagiaire $stagiaire)
    {
        $this->authorize('parentCanView', $stagiaire);

        $notes = Note::where('stagiaire_id', $stagiaire->id)
            ->with(['evaluation.affectation.module'])
            ->orderBy('created_at', 'desc')
            ->get();

        return $this->success($notes);
    }

    public function attendance(Request $request, Stagiaire $stagiaire)
    {
        $this->authorize('parentCanView', $stagiaire);

        $from = $request->get('from', now()->startOfMonth()->format('Y-m-d'));
        $to = $request->get('to', now()->format('Y-m-d'));
        $studentUserId = (int) $stagiaire->user_id;

        // [MERGED] Added Seance based query from V2 for backward/forward compatibility
        $attendances = Attendance::query()
            ->where(function ($q) use ($studentUserId, $stagiaire) {
                $q->where('student_id', $studentUserId)
                    ->orWhere('stagiaire_id', $stagiaire->id);
            })
            ->where(function ($q) use ($from, $to) {
                $q->whereBetween('date', [$from, $to])
                    ->orWhereHas('seance', fn ($sub) => $sub->whereBetween('date', [$from, $to]));
            })
            ->with(['module:id,code,label', 'group:id,label', 'seance.affectation.module'])
            ->orderByDesc('created_at')
            ->get();

        $total = Attendance::query()
            ->where(function ($q) use ($studentUserId, $stagiaire) {
                $q->where('student_id', $studentUserId)
                    ->orWhere('stagiaire_id', $stagiaire->id);
            })
            ->where(function ($q) use ($from, $to) {
                $q->whereBetween('date', [$from, $to])
                    ->orWhereHas('seance', fn ($sub) => $sub->whereBetween('date', [$from, $to]));
            });

        $presentCount = (clone $total)->whereIn('status', ['present', 'late', 'retard'])->count();
        $totalCount = (clone $total)->count();

        return $this->success([
            'attendances' => $attendances,
            'summary' => [
                'from' => $from,
                'to' => $to,
                'present_count' => $presentCount,
                'total_count' => $totalCount,
                'rate_percent' => $totalCount > 0 ? round($presentCount / $totalCount * 100, 2) : 0,
            ],
        ]);
    }

    /**
     * Parent-only child details endpoint with ownership check (IDOR-safe).
     * Includes notes, timetable and absences in one payload.
     */
    public function show(Request $request, Stagiaire $stagiaire)
    {
        $this->authorize('parentCanView', $stagiaire);

        $stagiaire->loadMissing(['user:id,name,email', 'filiere:id,code,name,label', 'groupe:id,name,label', 'groupes:id,name,label']);

        $groupIds = $stagiaire->groupes->pluck('id')->map(fn ($id) => (int) $id)->all();
        if ($stagiaire->groupe_id && ! in_array((int) $stagiaire->groupe_id, $groupIds, true)) {
            $groupIds[] = (int) $stagiaire->groupe_id;
        }

        $notes = Note::query()
            ->where('stagiaire_id', $stagiaire->id)
            ->with(['evaluation.module'])
            ->latest()
            ->limit(20)
            ->get()
            ->map(fn (Note $n) => [
                'id' => (int) $n->id,
                'value' => $n->valeur,
                'evaluation' => $n->evaluation ? [
                    'id' => (int) $n->evaluation->id,
                    'label' => $n->evaluation->item_label ?? $n->evaluation->type,
                ] : null,
                'module' => $n->evaluation?->module ? [
                    'id' => (int) $n->evaluation->module->id,
                    'code' => $n->evaluation->module->code,
                    'label' => $n->evaluation->module->label,
                ] : null,
                'date' => $n->created_at?->toDateString(),
            ])
            ->values()
            ->all();

        $timetable = Seance::query()
            ->whereDate('date', '>=', now()->subDays(7)->toDateString())
            ->where(function ($query) use ($groupIds, $stagiaire) {
                if ($groupIds !== []) {
                    $query->whereIn('groupe_id', $groupIds);
                }
                if ($stagiaire->filiere_id) {
                    $query->orWhere('filiere_id', $stagiaire->filiere_id);
                }
            })
            ->with(['module:id,code,label', 'groupe:id,name,label', 'user:id,name'])
            ->orderBy('date')
            ->orderBy('start_time')
            ->limit(25)
            ->get()
            ->map(fn (Seance $s) => [
                'id' => (int) $s->id,
                'date' => (string) $s->date,
                'start_time' => (string) $s->start_time,
                'end_time' => (string) $s->end_time,
                'status' => (string) $s->status,
                'type' => (string) $s->type,
                'module' => $s->module ? [
                    'id' => (int) $s->module->id,
                    'code' => $s->module->code,
                    'label' => $s->module->label,
                ] : null,
                'group' => $s->groupe ? [
                    'id' => (int) $s->groupe->id,
                    'label' => $s->groupe->label ?? $s->groupe->name,
                ] : null,
                'teacher' => $s->user ? ['id' => (int) $s->user->id, 'name' => $s->user->name] : null,
            ])
            ->values()
            ->all();

        $absences = Absence::query()
            ->where('stagiaire_id', $stagiaire->id)
            ->with(['seance.module:id,code,label', 'seance.groupe:id,name,label'])
            ->latest()
            ->limit(30)
            ->get()
            ->map(fn (Absence $a) => [
                'id' => (int) $a->id,
                'date' => is_object($a->seance?->date)
                    ? $a->seance->date->toDateString()
                    : ((string) ($a->seance?->date ?? $a->created_at?->toDateString())),
                'seance_id' => $a->seance_id ? (int) $a->seance_id : null,
                'module' => $a->seance?->module ? [
                    'id' => (int) $a->seance->module->id,
                    'code' => $a->seance->module->code,
                    'label' => $a->seance->module->label,
                ] : null,
                'group' => $a->seance?->groupe ? [
                    'id' => (int) $a->seance->groupe->id,
                    'label' => $a->seance->groupe->label ?? $a->seance->groupe->name,
                ] : null,
            ])
            ->values()
            ->all();

        return $this->success([
            'child' => [
                'id' => (int) $stagiaire->id,
                'name' => $stagiaire->user?->name,
                'email' => $stagiaire->user?->email,
                'cef_number' => $stagiaire->cef_number,
                'status' => $stagiaire->status,
                'filiere' => $stagiaire->filiere ? [
                    'id' => (int) $stagiaire->filiere->id,
                    'code' => $stagiaire->filiere->code,
                    'label' => $stagiaire->filiere->label ?? $stagiaire->filiere->name,
                ] : null,
                'groups' => $stagiaire->groupes->map(fn ($g) => [
                    'id' => (int) $g->id,
                    'label' => $g->label ?? $g->name,
                ])->values()->all(),
            ],
            'notes' => $notes,
            'timetable' => $timetable,
            'absences' => $absences,
        ]);
    }

    /**
     * Admin endpoint: list parent profiles for assignment screen.
     */
    public function adminParents()
    {
        $parents = StudentParent::query()
            ->with('user:id,name,email')
            ->withCount('stagiaires')
            ->orderBy('id')
            ->get()
            ->map(fn (StudentParent $parent) => [
                'id' => (int) $parent->id,
                'name' => $parent->user?->name,
                'email' => $parent->user?->email,
                'linked_children_count' => (int) $parent->stagiaires_count,
            ])
            ->values()
            ->all();

        return $this->success($parents);
    }

    /**
     * Admin endpoint: list stagiaires and whether they are linked to selected parent.
     */
    public function adminLinkableStagiaires(StudentParent $parent)
    {
        $stagiaires = Stagiaire::query()
            ->with(['user:id,name,email', 'filiere:id,code,label,name', 'groupe:id,name,label'])
            ->orderBy('id')
            ->get();

        $pivotByStagiaire = DB::table('parent_stagiaire')
            ->whereIn('stagiaire_id', $stagiaires->pluck('id'))
            ->get()
            ->groupBy('stagiaire_id');

        $parentId = (int) $parent->id;

        $payload = $stagiaires->map(function (Stagiaire $s) use ($pivotByStagiaire, $parentId) {
            $rows = collect($pivotByStagiaire->get($s->id, collect()));
            $linkedToParent = $rows->contains(fn ($r) => (int) $r->parent_id === $parentId);
            $hasOtherParents = $rows->contains(fn ($r) => (int) $r->parent_id !== $parentId);

            return [
                'id' => $s->id,
                'cef_number' => $s->cef_number,
                'status' => $s->status,
                'user' => $s->user ? ['name' => $s->user->name, 'email' => $s->user->email] : null,
                'filiere' => $s->filiere ? ['label' => $s->filiere->label ?? $s->filiere->name ?? $s->filiere->code] : null,
                'groupe' => $s->groupe ? ['label' => $s->groupe->label ?? $s->groupe->name] : null,
                'linked_to_me' => $linkedToParent,
                'has_other_parents' => $hasOtherParents,
            ];
        })->values()->all();

        return $this->success($payload);
    }

    /**
     * Admin endpoint: sync selected stagiaires for a target parent.
     */
    public function adminLinkStagiaires(AdminLinkParentStagiairesRequest $request, StudentParent $parent)
    {
        /** @var list<int> $ids */
        $ids = array_map('intval', $request->validated('stagiaire_ids'));
        $before = $parent->stagiaires()->get()->pluck('id')->map(fn ($id) => (int) $id)->all();

        DB::transaction(function () use ($parent, $ids, $before): void {
            $parent->stagiaires()->sync($ids);
            $touched = array_values(array_unique(array_merge($before, $ids)));
            $this->parentStagiaireDenormalize->syncForStagiaireIds($touched);
        });

        return $this->success([
            'linked_ids' => array_values($ids),
            'count' => count($ids),
        ], [], 'Liens enregistrés.');
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Groupe;
use App\Models\Niveau;
use App\Models\User;
use App\Services\AttendanceService;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class GroupController extends Controller
{
    public function __construct(private AttendanceService $attendanceService) {}

    public function index(Request $request)
    {
        $user = $request->user();
        $query = Groupe::query()->with(['filiere', 'niveau.filiere', 'anneeScolaire'])->withCount('students');
        $isTeacherRole = $user->role === 'teacher' || $user->role === 'formateur';

        if ($isTeacherRole) {
            $query->whereIn('id', $this->teacherGroupIds($user));
            $query->with(['stagiaires.user:id,name']);
        } elseif ($this->isStudentRole($user->role)) {
            [, $groupeIds] = $this->resolveStudentScope($request);
            if ($groupeIds->isEmpty()) {
                $query->whereRaw('0 = 1');
            } else {
                $query->whereIn('id', $groupeIds);
            }
        } elseif ($request->filled('niveau_id')) {
            $query->where('niveau_id', (int) $request->niveau_id);
        } elseif ($request->filled('filiere_id')) {
            $filiereIdInput = (int) $request->filiere_id;
            $query->where('filiere_id', $filiereIdInput);
        }

        if ($request->filled('year_id')) {
            $query->where('annee_scolaire_id', (int) $request->year_id);
        }

        $perPage = min((int) $request->get('per_page', 50), 100);
        $paginator = $query->orderBy('name')->paginate($perPage);
        $items = $paginator->items();
        $list = is_array($items) ? $items : collect($items)->values()->all();

        return $this->success($list, [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'niveau_id' => 'required|exists:niveaux,id',
            'annee_scolaire_id' => 'required|exists:annees_scolaires,id',
            'name' => 'nullable|string|max:50',
            'label' => 'nullable|string|max:50',
            'year_level' => 'required|integer|in:1,2',
            'capacity' => 'integer|min:1',
        ]);

        $niveau = Niveau::query()->findOrFail((int) $validated['niveau_id']);
        $label = (string) ($validated['label'] ?? $validated['name'] ?? '');
        $validated['label'] = $label;
        $validated['name'] = $label;
        $validated['filiere_id'] = $niveau->filiere_id;

        validator(
            ['label' => $label],
            [
                'label' => [
                    'required',
                    'string',
                    'max:50',
                    Rule::unique('groupes', 'label')->where(fn ($query) => $query->where('niveau_id', $validated['niveau_id'])),
                ],
            ]
        )->validate();

        $group = Groupe::create($validated);

        return $this->created($group->load(['filiere', 'niveau.filiere', 'anneeScolaire']));
    }

    public function show(Request $request, Groupe $group)
    {
        $user = $request->user();

        if ($user->role === 'teacher' || $user->role === 'formateur') {
            $teacherGroupIds = $this->teacherGroupIds($user);
            if (! in_array((int) $group->id, $teacherGroupIds, true)) {
                abort(403, 'Acces refuse a ce groupe.');
            }

            return $this->success($group->load(['filiere', 'niveau.filiere', 'anneeScolaire', 'stagiaires.user'])->loadCount('students'));
        }

        if ($this->isStudentRole($user->role)) {
            [, $groupeIds] = $this->resolveStudentScope($request);
            if (! $groupeIds->contains((int) $group->id)) {
                abort(403, 'Acces refuse a ce groupe.');
            }

            // FIXED: load stagiaires.user so TakeAttendancePage can populate the student list
            return $this->success($group->load(['filiere', 'niveau.filiere', 'anneeScolaire', 'stagiaires.user'])->loadCount('students'));
        }

        return $this->success($group->load(['filiere', 'niveau.filiere', 'anneeScolaire', 'stagiaires.user'])->loadCount('students'));
    }

    public function update(Request $request, Groupe $group)
    {
        $validated = $request->validate([
            'niveau_id' => 'sometimes|exists:niveaux,id',
            'name' => 'nullable|string|max:50',
            'label' => 'nullable|string|max:50',
            'year_level' => 'integer|in:1,2',
            'capacity' => 'integer|min:1',
        ]);

        if (isset($validated['niveau_id'])) {
            $niveau = Niveau::query()->findOrFail((int) $validated['niveau_id']);
            $validated['filiere_id'] = $niveau->filiere_id;
        }

        if (isset($validated['label']) || isset($validated['name'])) {
            $label = (string) ($validated['label'] ?? $validated['name'] ?? $group->label);
            $validated['label'] = $label;
            $validated['name'] = $label;

            validator(
                ['label' => $label],
                [
                    'label' => [
                        'required',
                        'string',
                        'max:50',
                        Rule::unique('groupes', 'label')
                            ->where(fn ($query) => $query->where('niveau_id', $validated['niveau_id'] ?? $group->niveau_id))
                            ->ignore($group->id),
                    ],
                ]
            )->validate();
        }
        $group->update($validated);

        return $this->success($group->fresh(['filiere', 'niveau.filiere', 'anneeScolaire']));
    }

    public function destroy(Groupe $group)
    {
        $group->delete();

        return response()->noContent();
    }

    public function enrollStudents(Request $request, Groupe $group)
    {
        $validated = $request->validate([
            'stagiaire_ids' => 'required|array',
            'stagiaire_ids.*' => 'exists:stagiaires,id',
        ]);

        $group->stagiaires()->syncWithoutDetaching($validated['stagiaire_ids']);

        return $this->success(['message' => 'Inscriptions enregistrees.']);
    }

    private function isStudentRole(?string $role): bool
    {
        return $role === 'student' || $role === 'stagiaire';
    }

    private function teacherGroupIds(User $user): array
    {
        $fromCurriculum = collect($this->teacherModules($user))
            ->pluck('groupe_id')
            ->filter()
            ->map(fn ($id) => (int) $id);

        $fromUserAssignments = DB::table('formateur_module_group')
            ->where('user_id', $user->id)
            ->pluck('groupe_id')
            ->map(fn ($id) => (int) $id);

        return $fromCurriculum->concat($fromUserAssignments)
            ->unique()
            ->values()
            ->all();
    }

    private function teacherModules(User $user): array
    {
        if (! $user->formateur) {
            return [];
        }

        return DB::table('teacher_module')
            ->where('teacher_id', $user->formateur->id)
            ->join('module_groupe', 'module_groupe.module_id', '=', 'teacher_module.module_id')
            ->select('module_groupe.*')
            ->get()
            ->all();
    }

    /**
     * @return array{0:?int,1:Collection}
     */
    private function resolveStudentScope(Request $request): array
    {
        $user = $request->user();
        if (! $user) {
            return [null, collect()];
        }

        $user->loadMissing('stagiaire.groupes');
        $stagiaire = $user->stagiaire;
        if (! $stagiaire) {
            return [null, collect()];
        }

        $filiereId = $stagiaire->getFiliereIdForScope();
        if ($filiereId === null) {
            return [null, collect()];
        }

        $groupeIds = $stagiaire->getGroupeIdsInFiliere($filiereId);
        if ($groupeIds->isEmpty() && $stagiaire->groupe_id) {
            $groupeIds = collect([(int) $stagiaire->groupe_id]);
        }

        return [(int) $filiereId, $groupeIds->map(fn ($id) => (int) $id)->unique()->values()];
    }
}

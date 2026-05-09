<?php

namespace App\Http\Controllers;

use App\Models\Filiere;
use App\Models\Module;
use App\Models\Niveau;
use App\Models\User;
use App\Services\TrainerModuleService;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class ModuleController extends Controller
{
    public function __construct(
        private TrainerModuleService $trainerModuleService
    ) {}

    public function academicCatalog(Request $request)
    {
        $path = database_path('data/academic.json');

        if (! File::exists($path)) {
            return $this->error('Fichier academic.json introuvable.', 404);
        }

        $decoded = json_decode(File::get($path), true);

        if (! is_array($decoded)) {
            return $this->error('Le contenu de academic.json est invalide.', 422);
        }

        $catalog = collect($decoded)
            ->map(function (array $filiere, int $filiereIndex) {
                $filiereCode = (string) ($filiere['filiere_code'] ?? '');
                $filiereName = (string) ($filiere['filiere_name'] ?? $filiereCode);

                $modules = collect($filiere['niveaux'] ?? [])
                    ->flatMap(function (array $niveau, int $niveauIndex) use ($filiereIndex, $filiereCode, $filiereName) {
                        $niveauNom = (string) ($niveau['niveau_nom'] ?? '');

                        return collect($niveau['modules'] ?? [])
                            ->map(function (array $module, int $moduleIndex) use ($filiereIndex, $niveauIndex, $filiereCode, $filiereName, $niveauNom) {
                                return [
                                    'id' => (($filiereIndex + 1) * 1000) + (($niveauIndex + 1) * 100) + ($moduleIndex + 1),
                                    'filiere_id' => $filiereIndex + 1,
                                    'code' => (string) ($module['code'] ?? ''),
                                    'label' => (string) ($module['name'] ?? $module['label'] ?? ''),
                                    'name' => (string) ($module['name'] ?? $module['label'] ?? ''),
                                    'masse_horaire' => (int) ($module['masse_horaire'] ?? 0),
                                    'coefficient' => (int) ($module['coefficient'] ?? 0),
                                    'semester' => $niveauNom,
                                    'niveau' => $niveauNom,
                                    'filiere' => [
                                        'id' => $filiereIndex + 1,
                                        'code' => $filiereCode,
                                        'label' => $filiereName,
                                    ],
                                ];
                            });
                    })
                    ->values();

                return [
                    'id' => $filiereIndex + 1,
                    'code' => $filiereCode,
                    'label' => $filiereName,
                    'type' => (string) ($filiere['type'] ?? ''),
                    'required_level' => (string) ($filiere['required_level'] ?? ''),
                    'duration_years' => (int) ($filiere['duration_years'] ?? 0),
                    'modules' => $modules,
                ];
            })
            ->values();

        $catalog = $this->scopeAcademicCatalogForUser($request->user(), $catalog);

        return $this->success($catalog);
    }

    /**
     * @param  \Illuminate\Support\Collection<int, array<string, mixed>>  $catalog
     * @return \Illuminate\Support\Collection<int, array<string, mixed>>
     */
    private function scopeAcademicCatalogForUser(?User $user, Collection $catalog): Collection
    {
        if (! $user) {
            return $catalog;
        }

        $role = strtolower((string) $user->role);
        if (in_array($role, ['admin', 'directeur', 'secretariat'], true)) {
            return $catalog;
        }

        if (in_array($role, ['teacher', 'formateur'], true)) {
            $codes = $this->trainerAssignedFiliereCodes($user);
            if ($codes === []) {
                return collect();
            }

            return $catalog->filter(function (array $filiere) use ($codes) {
                $code = strtoupper(trim((string) ($filiere['code'] ?? '')));

                return $code !== '' && in_array($code, $codes, true);
            })->values();
        }

        if (in_array($role, ['student', 'stagiaire'], true)) {
            $user->loadMissing('stagiaire.filiere', 'stagiaire.groupe.filiere');
            $code = strtoupper(trim((string) (
                $user->stagiaire?->filiere?->code
                ?? $user->stagiaire?->groupe?->filiere?->code
                ?? ''
            )));

            if ($code === '') {
                return collect();
            }

            return $catalog->filter(fn (array $filiere) => strtoupper(trim((string) ($filiere['code'] ?? ''))) === $code)->values();
        }

        if ($role === 'parent') {
            $user->loadMissing('parent');
            $codes = [];
            foreach ($user->parent?->stagiaires()->with(['filiere', 'groupe.filiere'])->get() ?? [] as $stagiaire) {
                $c = strtoupper(trim((string) (
                    $stagiaire->filiere?->code
                    ?? $stagiaire->groupe?->filiere?->code
                    ?? ''
                )));
                if ($c !== '') {
                    $codes[] = $c;
                }
            }
            $codes = array_values(array_unique($codes));
            if ($codes === []) {
                return collect();
            }

            return $catalog->filter(function (array $filiere) use ($codes) {
                $code = strtoupper(trim((string) ($filiere['code'] ?? '')));

                return $code !== '' && in_array($code, $codes, true);
            })->values();
        }

        return collect();
    }

    /**
     * @return list<string>
     */
    private function trainerAssignedFiliereCodes(User $user): array
    {
        $userId = (int) $user->id;
        $formateurId = (int) ($user->formateur?->id ?? 0);
        $filiereIds = Module::query()
            ->where(function ($q) use ($userId, $formateurId) {
                $q->whereHas('trainers', fn ($t) => $t->where('users.id', $userId));
                if ($formateurId > 0) {
                    $q->orWhereExists(function ($sq) use ($formateurId) {
                        $sq->selectRaw('1')
                            ->from('teacher_module')
                            ->whereColumn('teacher_module.module_id', 'modules.id')
                            ->where('teacher_module.teacher_id', $formateurId);
                    });
                }
            })
            ->pluck('filiere_id')
            ->filter()
            ->unique()
            ->all();

        if ($filiereIds === []) {
            return [];
        }

        return Filiere::query()->whereIn('id', $filiereIds)->pluck('code')
            ->map(fn ($c) => strtoupper(trim((string) $c)))
            ->filter()
            ->unique()
            ->values()
            ->all();
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Module::with(['filiere', 'niveau']);
        $trainerScopedModuleIds = $this->resolveTrainerScopedModuleIds($request);

        if ($trainerScopedModuleIds !== null) {
            if ($trainerScopedModuleIds->isEmpty()) {
                return $this->success([]);
            }

            $query->whereIn('modules.id', $trainerScopedModuleIds->all());
        }

        if ($this->isStudentRole($request->user()?->role)) {
            [$filiereId, $groupeIds] = $this->resolveStudentScope($request);
            if ($filiereId === null || $groupeIds->isEmpty()) {
                return $this->success([]);
            }

            $moduleIds = DB::table('module_groupe')
                ->whereIn('groupe_id', $groupeIds)
                ->pluck('module_id')
                ->unique()
                ->values();

            if ($moduleIds->isEmpty()) {
                return $this->success([]);
            }

            $query->where('filiere_id', $filiereId)
                ->whereIn('id', $moduleIds);
        } elseif ($request->user()?->role === 'parent') {
            $scope = $this->resolveParentModuleScope($request->user());
            if ($scope['filiere_ids']->isEmpty() || $scope['module_ids']->isEmpty()) {
                return $this->success([]);
            }

            $query->whereIn('filiere_id', $scope['filiere_ids']->all())
                ->whereIn('id', $scope['module_ids']->all());
        } elseif ($request->filled('filiere_id')) {
            // Use the direct filiere_id column — faster and doesn't require a niveau join.
            $query->where('filiere_id', (int) $request->filiere_id);
        }

        // Raise ceiling to 200 so all modules for a filiere load in one request.
        $perPage = min((int) $request->get('per_page', 200), 200);

        return $query->paginate($perPage);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'niveau_id' => 'required|exists:niveaux,id',
            'code' => 'required|string|max:20',
            'name' => 'nullable|string|max:150',
            'label' => 'nullable|string|max:150',
            'masse_horaire' => 'required|integer|min:1',
            'coefficient' => 'required|integer|min:1',
            'semester' => 'required|in:S1,S2,S3,S4',
        ]);

        $niveau = Niveau::query()->findOrFail((int) $validated['niveau_id']);
        $label = (string) ($validated['label'] ?? $validated['name'] ?? '');
        $validated['label'] = $label;
        $validated['name'] = $label;
        $validated['filiere_id'] = $niveau->filiere_id;

        return $this->created(Module::create($validated)->load('niveau.filiere'));
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Module $module)
    {
        $this->enforceTrainerModuleScopeForSingle($request, $module);
        $this->authorizeStudentAccess($request, $module);
        $this->authorizeParentModuleAccess($request, $module);

        return $module->load(['niveau.filiere', 'syllabusItems']);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Module $module)
    {
        $validated = $request->validate([
            'niveau_id' => 'exists:niveaux,id',
            'code' => 'string|max:20',
            'name' => 'nullable|string|max:150',
            'label' => 'nullable|string|max:150',
            'masse_horaire' => 'integer|min:1',
            'coefficient' => 'integer|min:1',
            'semester' => 'in:S1,S2,S3,S4',
        ]);

        if (isset($validated['niveau_id'])) {
            $niveau = Niveau::query()->findOrFail((int) $validated['niveau_id']);
            $validated['filiere_id'] = $niveau->filiere_id;
        }
        if (isset($validated['label']) || isset($validated['name'])) {
            $label = (string) ($validated['label'] ?? $validated['name'] ?? $module->label);
            $validated['label'] = $label;
            $validated['name'] = $label;
        }
        $module->update($validated);

        return $this->success($module->fresh(['niveau.filiere', 'syllabusItems']));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Module $module)
    {
        $module->delete();

        return response()->noContent();
    }

    // --- Syllabus Management ---
    public function showSyllabus(Request $request, Module $module)
    {
        $this->enforceTrainerModuleScopeForSingle($request, $module);
        $this->authorizeStudentAccess($request, $module);
        $this->authorizeParentModuleAccess($request, $module);

        return $module->syllabusItems()->orderBy('order')->get();
    }

    public function updateSyllabus(Request $request, Module $module)
    {
        $this->enforceTrainerModuleScopeForSingle($request, $module);

        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.label' => 'required|string',
            'items.*.estimated_hours' => 'required|integer',
            'items.*.order' => 'required|integer',
        ]);

        $module->syllabusItems()->delete();
        $module->syllabusItems()->createMany($validated['items']);

        return response()->json(['message' => 'Syllabus updated successfully', 'items' => $module->syllabusItems()->orderBy('order')->get()]);
    }

    private function authorizeStudentAccess(Request $request, Module $module): void
    {
        if (! $this->isStudentRole($request->user()?->role)) {
            return;
        }

        [$filiereId, $groupeIds] = $this->resolveStudentScope($request);

        if ($filiereId === null || $groupeIds->isEmpty() || (int) $module->filiere_id !== $filiereId) {
            abort(403, 'Acces refuse a ce module.');
        }

        $isAssigned = DB::table('module_groupe')
            ->where('module_id', $module->id)
            ->whereIn('groupe_id', $groupeIds)
            ->exists();

        if (! $isAssigned) {
            abort(403, 'Acces refuse a ce module.');
        }
    }

    private function authorizeParentModuleAccess(Request $request, Module $module): void
    {
        if ($request->user()?->role !== 'parent') {
            return;
        }

        $scope = $this->resolveParentModuleScope($request->user());
        if ($scope['filiere_ids']->isEmpty() || ! $scope['filiere_ids']->contains((int) $module->filiere_id)) {
            abort(403, 'Acces refuse a ce module.');
        }

        if (! $scope['module_ids']->contains((int) $module->id)) {
            abort(403, 'Acces refuse a ce module.');
        }
    }

    /**
     * @return array{filiere_ids: Collection, module_ids: Collection}
     */
    private function resolveParentModuleScope(User $user): array
    {
        $user->loadMissing('parent');
        $stagiaires = $user->parent?->stagiaires()->with(['groupe.filiere', 'groupes', 'filiere'])->get() ?? collect();
        if ($stagiaires->isEmpty()) {
            return ['filiere_ids' => collect(), 'module_ids' => collect()];
        }

        $groupeIds = $stagiaires
            ->flatMap(fn ($s) => $s->groupes->pluck('id'))
            ->merge($stagiaires->pluck('groupe_id'))
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        $filiereIds = $stagiaires
            ->map(function ($s) {
                return (int) ($s->filiere_id
                    ?? $s->groupe?->filiere_id
                    ?? $s->filiere?->id
                    ?? 0);
            })
            ->filter()
            ->unique()
            ->values();

        if ($groupeIds->isEmpty() || $filiereIds->isEmpty()) {
            return ['filiere_ids' => collect(), 'module_ids' => collect()];
        }

        $moduleIds = DB::table('module_groupe')
            ->whereIn('groupe_id', $groupeIds->all())
            ->pluck('module_id')
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        return [
            'filiere_ids' => $filiereIds,
            'module_ids' => $moduleIds,
        ];
    }

    private function isStudentRole(?string $role): bool
    {
        return $role === 'student' || $role === 'stagiaire';
    }

    private function isTrainerRole(?string $role): bool
    {
        return $role === 'trainer' || $role === 'teacher' || $role === 'formateur';
    }

    private function enforceTrainerModuleScopeForList(Request $request): void
    {
        // no-op (kept for backward compatibility)
    }

    private function enforceTrainerModuleScopeForSingle(Request $request, Module $module): void
    {
        $user = $request->user();
        if (! $user || ! $this->isTrainerRole((string) $user->role)) {
            return;
        }

        if (! $this->trainerModuleService->canAccessModule($user, (int) $module->id)) {
            abort(403, 'Module non autorise pour ce formateur.');
        }
    }

    private function resolveTrainerScopedModuleIds(Request $request): ?Collection
    {
        $user = $request->user();
        if (! $user || ! $this->isTrainerRole((string) $user->role)) {
            return null;
        }

        return $this->trainerModuleService
            ->getTrainerModules($user)
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();
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

<?php

namespace App\Http\Controllers;

use App\Models\Module;
use App\Models\Niveau;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class ModuleController extends Controller
{
    public function academicCatalog()
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

        return $this->success($catalog);
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Module::with(['filiere', 'niveau']);

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
        $this->authorizeStudentAccess($request, $module);

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
        $this->authorizeStudentAccess($request, $module);

        return $module->syllabusItems()->orderBy('order')->get();
    }

    public function updateSyllabus(Request $request, Module $module)
    {
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

    private function isStudentRole(?string $role): bool
    {
        return $role === 'student' || $role === 'stagiaire';
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

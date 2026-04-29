<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AnneeScolaire;
use App\Models\Formateur;
use App\Models\Groupe;
use App\Models\Module;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class FormateurAssignmentController extends Controller
{
    /**
     * Resolve school year id: explicit query param, then calendar containment using ?date=YYYY-MM-DD,
     * then is_current / latest (avoids empty assignments when is_current ≠ teacher_module.academic_year).
     */
    private function resolveAcademicYearId(Request $request): int
    {
        $academicYearId = (int) ($request->query('academic_year') ?: 0);
        $dateStr = $request->query('date');
        if ($academicYearId <= 0 && is_string($dateStr) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateStr)) {
            $academicYearId = (int) (AnneeScolaire::query()
                ->whereDate('start_date', '<=', $dateStr)
                ->whereDate('end_date', '>=', $dateStr)
                ->orderByDesc('year_start')
                ->value('id') ?? 0);
        }
        if ($academicYearId <= 0) {
            $academicYearId = (int) (AnneeScolaire::where('is_current', true)->value('id')
                ?? AnneeScolaire::latest('year_start')->value('id')
                ?? 0);
        }

        return $academicYearId;
    }

    /**
     * When formateur_module_group has rows for (user, module), only those groupes are returned.
     * Otherwise keep all module groupes linked for the academic year (legacy / admin-only assignments).
     *
     * @param  Collection<int, Module>  $modules
     * @return Collection<int, array<string, mixed>>
     */
    private function mapModulesWithScopedGroupes(Collection $modules, int $ownerUserId): Collection
    {
        return $modules->map(function (Module $m) use ($ownerUserId) {
            $explicitIds = DB::table('formateur_module_group')
                ->where('user_id', $ownerUserId)
                ->where('module_id', $m->id)
                ->pluck('groupe_id')
                ->map(fn ($id) => (int) $id)
                ->unique()
                ->values()
                ->all();

            $groupes = $m->groupes;
            if ($explicitIds !== []) {
                $groupes = $groupes->whereIn('id', $explicitIds);
            }

            // Admin user-modal assignments may omit module_groupe rows; pivot eager load is then empty.
            if ($groupes->isEmpty() && $explicitIds !== []) {
                $groupes = Groupe::query()
                    ->whereIn('id', $explicitIds)
                    ->with('filiere:id,code,label')
                    ->select('groupes.id', 'groupes.label', 'groupes.filiere_id')
                    ->get();
            }

            // Drop groupes whose filière does not match the module (fixes bad module_groupe links in DB).
            $moduleFiliereId = $m->filiere_id;
            if ($moduleFiliereId === null) {
                $moduleFiliereId = DB::table('modules')
                    ->join('niveaux', 'niveaux.id', '=', 'modules.niveau_id')
                    ->where('modules.id', $m->id)
                    ->value('niveaux.filiere_id');
            }
            if ($moduleFiliereId !== null && $groupes->isNotEmpty()) {
                $groupes = $groupes->filter(function ($g) use ($moduleFiliereId) {
                    $gf = $g->filiere_id ?? null;

                    return $gf === null || (int) $gf === (int) $moduleFiliereId;
                });
            }

            return [
                'id' => $m->id,
                'code' => $m->code,
                'label' => $m->label,
                'groupes' => $groupes->values()->map(fn ($g) => [
                    'id' => $g->id,
                    'label' => $g->label,
                    'filiere' => $g->filiere ? [
                        'id' => $g->filiere->id,
                        'code' => $g->filiere->code,
                        'label' => $g->filiere->label,
                    ] : null,
                ]),
            ];
        })->values();
    }

    private function ensureAdminAssignmentAccess(Request $request): void
    {
        $user = $request->user();
        if (! $user) {
            abort(401, 'Non authentifie.');
        }

        if ($user->role === 'admin') {
            return;
        }

        abort(403, 'Acces refuse.');
    }

    /**
     * Admin: assign modules to a teacher for one academic year.
     * Body: { teacher_id, academic_year, module_ids[] }
     */
    public function store(Request $request)
    {
        $this->ensureAdminAssignmentAccess($request);

        $validated = $request->validate([
            'teacher_id' => ['required', 'integer', 'exists:formateurs,id'],
            'academic_year' => ['required', 'integer', 'exists:annees_scolaires,id'],
            'module_ids' => ['required', 'array'],
            'module_ids.*' => ['integer', 'exists:modules,id'],
        ]);

        $formateur = Formateur::query()->findOrFail((int) $validated['teacher_id']);
        if ($formateur->filiere_id !== null) {
            $expectedFiliere = (int) $formateur->filiere_id;
            $invalidModuleIds = [];
            foreach (array_unique(array_map('intval', $validated['module_ids'])) as $moduleId) {
                $moduleFiliereId = DB::table('modules')
                    ->join('niveaux', 'niveaux.id', '=', 'modules.niveau_id')
                    ->where('modules.id', $moduleId)
                    ->value('niveaux.filiere_id');
                if ($moduleFiliereId === null || (int) $moduleFiliereId !== $expectedFiliere) {
                    $invalidModuleIds[] = $moduleId;
                }
            }
            if ($invalidModuleIds !== []) {
                throw ValidationException::withMessages([
                    'module_ids' => ['Chaque module doit appartenir a la meme filiere que le formateur ('.$expectedFiliere.').'],
                ]);
            }
        }

        DB::transaction(function () use ($validated) {
            DB::table('teacher_module')
                ->where('teacher_id', (int) $validated['teacher_id'])
                ->where('academic_year', (int) $validated['academic_year'])
                ->delete();

            $rows = collect($validated['module_ids'])
                ->map(fn ($moduleId) => (int) $moduleId)
                ->unique()
                ->values()
                ->map(fn ($moduleId) => [
                    'teacher_id' => (int) $validated['teacher_id'],
                    'module_id' => $moduleId,
                    'academic_year' => (int) $validated['academic_year'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ])
                ->all();

            if (! empty($rows)) {
                DB::table('teacher_module')->insert($rows);
            }
        });

        return $this->success(['message' => 'Assignations formateur enregistrées.']);
    }

    /**
     * Admin: get one teacher assignments for an academic year.
     * GET /formateur-assignments/formateurs/{formateur}?academic_year=ID
     */
    public function byTeacher(Request $request, Formateur $formateur)
    {
        $this->ensureAdminAssignmentAccess($request);

        $academicYearId = $this->resolveAcademicYearId($request);

        if ($academicYearId <= 0) {
            return $this->success([
                'teacher_id' => $formateur->id,
                'academic_year' => null,
                'modules' => [],
            ]);
        }

        $modules = $this->loadFormateurModulesForYear($formateur, $academicYearId);

        $payload = $this->mapModulesWithScopedGroupes($modules, (int) $formateur->user_id);

        return $this->success([
            'teacher_id' => $formateur->id,
            'academic_year' => $academicYearId,
            'modules' => $payload,
        ]);
    }

    /**
     * Teacher: get own assigned modules for dashboard.
     * GET /formateur-assignments/me?academic_year=ID
     */
    public function me(Request $request)
    {
        $user = $request->user();
        $formateur = $user?->formateur;
        if (! $formateur) {
            return $this->success(['modules' => [], 'academic_year' => null]);
        }

        $academicYearId = $this->resolveAcademicYearId($request);

        if ($academicYearId <= 0) {
            return $this->success([
                'teacher_id' => $formateur->id,
                'academic_year' => null,
                'modules' => [],
            ]);
        }

        $modules = $this->loadFormateurModulesForYear($formateur, $academicYearId);

        if ($modules->isEmpty()) {
            $altYear = (int) (DB::table('teacher_module')
                ->where('teacher_id', $formateur->id)
                ->orderByDesc('academic_year')
                ->value('academic_year') ?? 0);
            if ($altYear > 0 && $altYear !== $academicYearId) {
                $academicYearId = $altYear;
                $modules = $this->loadFormateurModulesForYear($formateur, $academicYearId);
            }
        }

        $ownerUserId = (int) $user->id;
        $payload = $this->mapModulesWithScopedGroupes($modules, $ownerUserId);

        return $this->success([
            'teacher_id' => $formateur->id,
            'academic_year' => $academicYearId,
            'modules' => $payload,
        ]);
    }

    /**
     * Modules from {@see Formateur::modules()} (teacher_module + academic year) plus legacy rows from
     * formateur_module (user edit modal), so Take Attendance matches admin assignments.
     *
     * @return Collection<int, Module>
     */
    private function loadFormateurModulesForYear(Formateur $formateur, int $academicYearId): Collection
    {
        $withGroupes = ['groupes' => fn ($q) => $q
            ->wherePivot('academic_year', $academicYearId)
            ->with('filiere:id,code,label')
            ->select('groupes.id', 'groupes.label', 'groupes.filiere_id'),
        ];

        $fromTeacher = $formateur->modules()
            ->wherePivot('academic_year', $academicYearId)
            ->with($withGroupes)
            ->select('modules.id', 'modules.code', 'modules.label', 'modules.filiere_id')
            ->get();

        $legacyIds = DB::table('formateur_module')
            ->where('user_id', $formateur->user_id)
            ->pluck('module_id')
            ->map(fn ($id) => (int) $id)
            ->all();

        $teacherIds = $fromTeacher->pluck('id')->map(fn ($id) => (int) $id)->all();
        $onlyLegacyIds = array_values(array_diff($legacyIds, $teacherIds));

        if ($onlyLegacyIds === []) {
            return $fromTeacher;
        }

        $fromLegacy = Module::query()
            ->whereIn('id', $onlyLegacyIds)
            ->with($withGroupes)
            ->select('modules.id', 'modules.code', 'modules.label', 'modules.filiere_id')
            ->get();

        $merged = $fromTeacher->concat($fromLegacy)->unique('id')->values();

        return $merged;
    }
}

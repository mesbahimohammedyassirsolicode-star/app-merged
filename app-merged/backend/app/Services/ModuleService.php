<?php

namespace App\Services;

use App\Models\AnneeScolaire;
use App\Models\Formateur;
use App\Models\Module;
use App\Models\ModuleProgress;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ModuleService
{
    /**
     * Resolve school year id: explicit query param, then calendar containment using ?date=YYYY-MM-DD,
     * then is_current / latest (aligned with FormateurAssignmentController).
     */
    public function resolveAcademicYearId(Request $request): int
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
     * Assigned modules for the academic year (teacher_module + formateur_module legacy merge).
     *
     * @return Collection<int, Module>
     */
    public function loadAssignedModules(Formateur $formateur, int $academicYearId): Collection
    {
        $withGroupes = ['groupes' => fn ($q) => $q
            ->wherePivot('academic_year', $academicYearId)
            ->with('filiere:id,code,label')
            ->select('groupes.id', 'groupes.label', 'groupes.filiere_id'),
        ];

        $fromTeacher = $formateur->modules()
            ->wherePivot('academic_year', $academicYearId)
            ->with($withGroupes)
            ->select('modules.id', 'modules.code', 'modules.label', 'modules.filiere_id', 'modules.semester', 'modules.masse_horaire', 'modules.coefficient')
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
            ->select('modules.id', 'modules.code', 'modules.label', 'modules.filiere_id', 'modules.semester', 'modules.masse_horaire', 'modules.coefficient')
            ->get();

        return $fromTeacher->concat($fromLegacy)->unique('id')->values();
    }

    /**
     * Modules assigned to the authenticated teacher/formateur with academic year fallback.
     *
     * @return array{modules: Collection<int, Module>, academic_year: int}
     */
    public function listAssignedModulesWithYear(User $user, Request $request): array
    {
        $formateur = $user->formateur;
        if (! $formateur) {
            return ['modules' => collect(), 'academic_year' => 0];
        }

        $academicYearId = $this->resolveAcademicYearId($request);

        if ($academicYearId <= 0) {
            return ['modules' => collect(), 'academic_year' => 0];
        }

        $modules = $this->loadAssignedModules($formateur, $academicYearId);

        if ($modules->isEmpty()) {
            $altYear = (int) (DB::table('teacher_module')
                ->where('teacher_id', $formateur->id)
                ->orderByDesc('academic_year')
                ->value('academic_year') ?? 0);
            if ($altYear > 0 && $altYear !== $academicYearId) {
                $academicYearId = $altYear;
                $modules = $this->loadAssignedModules($formateur, $academicYearId);
            }
        }

        $modules->loadMissing(['filiere:id,code,label,name']);

        return ['modules' => $modules, 'academic_year' => $academicYearId];
    }

    /**
     * Attach progress rows for this formateur (relation name: formateurProgress).
     *
     * @param  Collection<int, Module>  $modules
     * @return Collection<int, Module>
     */
    public function attachProgressToModules(Formateur $formateur, Collection $modules): Collection
    {
        if ($modules->isEmpty()) {
            return $modules;
        }

        $ids = $modules->pluck('id')->map(fn ($id) => (int) $id)->all();

        $map = ModuleProgress::query()
            ->where('formateur_id', $formateur->id)
            ->whereIn('module_id', $ids)
            ->get()
            ->keyBy('module_id');

        return $modules->each(function (Module $m) use ($map) {
            $m->setRelation('formateurProgress', $map->get($m->id));
        });
    }

    public function assertModuleAssignedToFormateur(Formateur $formateur, int $moduleId, int $academicYearId): void
    {
        $assigned = $this->loadAssignedModules($formateur, $academicYearId);
        if (! $assigned->contains('id', $moduleId)) {
            abort(403, 'Ce module n’est pas assigné à votre profil.');
        }
    }

    public function upsertProgress(Formateur $formateur, int $moduleId, int $progression, ?Carbon $lastSession): ModuleProgress
    {
        return ModuleProgress::updateOrCreate(
            [
                'formateur_id' => $formateur->id,
                'module_id' => $moduleId,
            ],
            [
                'progression' => $progression,
                'last_session' => $lastSession ?? now(),
            ]
        );
    }
}

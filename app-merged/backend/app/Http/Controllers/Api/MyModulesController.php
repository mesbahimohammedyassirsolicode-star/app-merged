<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateModuleProgressRequest;
use App\Http\Resources\MyModuleResource;
use App\Models\Module;
use App\Services\ModuleService;
use Carbon\Carbon;
use Illuminate\Http\Request;

class MyModulesController extends Controller
{
    public function __construct(
        protected ModuleService $moduleService
    ) {}

    /**
     * GET /my-modules — modules assignés au formateur connecté avec filière et progression.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        if (! $user) {
            return $this->error('Non authentifié.', 401);
        }

        ['modules' => $modules, 'academic_year' => $academicYearId] = $this->moduleService->listAssignedModulesWithYear($user, $request);

        $formateur = $user->formateur;
        if ($formateur) {
            $this->moduleService->attachProgressToModules($formateur, $modules);
        }

        return $this->success(
            MyModuleResource::collection($modules)->resolve(),
            ['academic_year' => $academicYearId],
        );
    }

    /**
     * PUT|POST /modules/{module}/progress — met à jour la progression (module assigné uniquement).
     */
    public function updateProgress(UpdateModuleProgressRequest $request, Module $module)
    {
        $user = $request->user();
        $formateur = $user?->formateur;

        if (! $formateur) {
            return $this->error('Profil formateur introuvable.', 403);
        }

        $academicYearId = $this->moduleService->resolveAcademicYearId($request);
        if ($academicYearId <= 0) {
            return $this->error('Année scolaire invalide. Fournissez academic_year.', 422);
        }

        $this->moduleService->assertModuleAssignedToFormateur($formateur, (int) $module->id, $academicYearId);

        $validated = $request->validated();
        $progression = (int) $validated['progression'];
        $lastSession = isset($validated['last_session'])
            ? Carbon::parse((string) $validated['last_session'])
            : null;

        $progress = $this->moduleService->upsertProgress($formateur, (int) $module->id, $progression, $lastSession);

        $module->loadMissing(['filiere:id,code,label,name']);
        $module->setRelation('formateurProgress', $progress);

        return $this->success((new MyModuleResource($module))->resolve());
    }
}

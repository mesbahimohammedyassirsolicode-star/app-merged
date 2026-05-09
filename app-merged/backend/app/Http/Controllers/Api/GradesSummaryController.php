<?php

namespace App\Http\Controllers\Api;

use App\Models\Groupe;
use App\Models\Module;
use App\Models\Stagiaire;
use App\Services\GradesSummaryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GradesSummaryController extends BaseApiController
{
    public function __construct(
        private GradesSummaryService $gradesSummaryService
    ) {}

    public function summaryByModuleGroup(Request $request)
    {
        $moduleId = $request->get('module_id');
        $groupId = $request->get('group_id');
        if (! $moduleId || ! $groupId) {
            return $this->error('module_id et group_id requis.', 422);
        }

        $module = Module::findOrFail((int) $moduleId);
        $groupe = Groupe::findOrFail((int) $groupId);

        $user = $request->user();
        if (in_array($user->role, ['admin', 'directeur', 'secretariat'], true)) {
            // full access
        } elseif ($user->role === 'teacher' || $user->role === 'formateur') {
            $isAssigned = $this->hasTeacherModuleGroupAccess($user->id, $module->id, $groupe->id);
            if (! $isAssigned) {
                return $this->error('Acces refuse.', 403);
            }
        } else {
            return $this->error('Acces refuse.', 403);
        }

        $data = $this->gradesSummaryService->summaryForModuleGroup($module, $groupe);

        return $this->success($data);
    }

    public function summaryByStagiaire(Request $request, Stagiaire $stagiaire)
    {
        $moduleId = $request->get('module_id');
        $groupId = $request->get('group_id');
        if (! $moduleId || ! $groupId) {
            return $this->error('module_id et group_id requis.', 422);
        }

        $module = Module::findOrFail((int) $moduleId);
        $groupe = Groupe::findOrFail((int) $groupId);

        $user = $request->user();
        if (! $stagiaire->groupes()->where('groupes.id', $groupe->id)->exists()) {
            return $this->error('Stagiaire hors groupe cible.', 422);
        }

        if ($user->role === 'teacher' || $user->role === 'formateur') {
            $isAssigned = $this->hasTeacherModuleGroupAccess($user->id, $module->id, $groupe->id);
            if (! $isAssigned) {
                return $this->error('Acces refuse.', 403);
            }
        } elseif ($user->role === 'student' || $user->role === 'stagiaire') {
            if ((int) ($user->stagiaire?->id ?? 0) !== (int) $stagiaire->id) {
                return $this->error('Acces refuse.', 403);
            }
        } elseif ($user->role === 'parent') {
            $isLinkedChild = $user->parent?->children()->where('stagiaires.id', $stagiaire->id)->exists() ?? false;
            if (! $isLinkedChild) {
                return $this->error('Acces refuse.', 403);
            }
        } elseif (! in_array($user->role, ['admin', 'directeur', 'secretariat'], true)) {
            return $this->error('Acces refuse.', 403);
        }

        $data = $this->gradesSummaryService->summaryForStagiaireAndModule($stagiaire, $module, $groupe);

        return $this->success($data);
    }

    private function hasTeacherModuleGroupAccess(int $userId, int $moduleId, int $groupId): bool
    {
        $hasScopedAssignment = DB::table('formateur_module_group')
            ->where('user_id', $userId)
            ->where('module_id', $moduleId)
            ->where('groupe_id', $groupId)
            ->exists();

        if ($hasScopedAssignment) {
            return true;
        }

        $teacherId = DB::table('formateurs')
            ->where('user_id', $userId)
            ->value('id');

        if (! $teacherId) {
            return false;
        }

        return DB::table('teacher_module')
            ->join('module_groupe', 'module_groupe.module_id', '=', 'teacher_module.module_id')
            ->where('teacher_module.teacher_id', $teacherId)
            ->where('teacher_module.module_id', $moduleId)
            ->where('module_groupe.groupe_id', $groupId)
            ->exists();
    }
}

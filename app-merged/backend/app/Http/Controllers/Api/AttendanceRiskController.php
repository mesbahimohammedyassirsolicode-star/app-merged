<?php

namespace App\Http\Controllers\Api;

use App\Models\Groupe;
use App\Models\Stagiaire;
use App\Models\User;
use App\Services\AttendanceRiskService;
use App\Services\AttendanceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AttendanceRiskController extends BaseApiController
{
    public function __construct(
        private AttendanceRiskService $attendanceRiskService,
        private AttendanceService $attendanceService
    ) {}

    public function summaryByGroup(Request $request, Groupe $group)
    {
        $this->assertTeacherOwnsGroupWhenTeacher($request->user()->id, $request->user()->role, $group->id);

        $anneeId = $request->get('annee_scolaire_id') ?? $group->annee_scolaire_id;
        $data = $this->attendanceRiskService->summaryForGroupe($group, (int) $anneeId);

        return $this->success($data);
    }

    public function summaryByStagiaire(Request $request, Stagiaire $stagiaire)
    {
        $anneeId = $request->get('annee_scolaire_id');
        if (! $anneeId) {
            return $this->error('annee_scolaire_id requis.', 422);
        }

        $user = $request->user();
        if ($user->role === 'teacher' || $user->role === 'formateur') {
            $groupIds = $stagiaire->groupes()->pluck('groupes.id')->all();
            $hasOwnedGroup = collect($groupIds)
                ->contains(fn (int $groupId) => $this->teacherOwnsAnyModuleForGroup($user, $groupId));
            if (! $hasOwnedGroup) {
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

        $data = $this->attendanceRiskService->summaryForStagiaire($stagiaire, (int) $anneeId);

        return $this->success($data);
    }

    private function assertTeacherOwnsGroupWhenTeacher(int $userId, string $role, int $groupId): void
    {
        if (! in_array($role, ['teacher', 'formateur'])) {
            return;
        }

        $user = request()->user();
        $ownsGroup = $user !== null
            && (int) $user->id === $userId
            && $this->teacherOwnsAnyModuleForGroup($user, $groupId);

        if (! $ownsGroup) {
            abort(403, 'Acces refuse.');
        }
    }

    private function teacherOwnsAnyModuleForGroup(User $teacherUser, int $groupId): bool
    {
        $moduleIds = DB::table('module_groupe')
            ->where('groupe_id', $groupId)
            ->pluck('module_id')
            ->map(fn ($id) => (int) $id)
            ->all();

        if (empty($moduleIds)) {
            return false;
        }

        foreach (array_unique($moduleIds) as $moduleId) {
            if ($this->attendanceService->teacherCanManageModuleGroup($teacherUser, (int) $moduleId, $groupId)) {
                return true;
            }
        }

        return false;
    }
}

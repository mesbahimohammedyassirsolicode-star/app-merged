<?php

namespace App\Http\Controllers\Api;

use App\Models\Progression;
use App\Models\Stagiaire;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProgressController extends BaseApiController
{
    public function index(Request $request, Stagiaire $stagiaire)
    {
        $user = $request->user();
        if ($user->role === 'teacher' || $user->role === 'formateur') {
            $scopedGroupIds = DB::table('formateur_module_group')
                ->where('user_id', $user->id)
                ->pluck('groupe_id')
                ->all();

            $legacyGroupIds = DB::table('teacher_module')
                ->join('formateurs', 'formateurs.id', '=', 'teacher_module.teacher_id')
                ->where('formateurs.user_id', $user->id)
                ->join('module_groupe', 'module_groupe.module_id', '=', 'teacher_module.module_id')
                ->pluck('module_groupe.groupe_id')
                ->all();

            $teacherGroupIds = collect(array_merge($scopedGroupIds, $legacyGroupIds))
                ->filter(fn ($id) => $id !== null)
                ->unique()
                ->values()
                ->all();

            $belongsToTeacher = $stagiaire->groupes()->whereIn('groupes.id', $teacherGroupIds)->exists();
            if (! $belongsToTeacher) {
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
        }

        $anneeId = $request->get('annee_scolaire_id');
        $groupeIds = $stagiaire->groupes()
            ->when($anneeId, fn ($q) => $q->where('groupes.annee_scolaire_id', $anneeId))
            ->pluck('groupes.id');

        $modules = DB::table('module_groupe')
            ->whereIn('groupe_id', $groupeIds)
            ->join('modules', 'modules.id', '=', 'module_groupe.module_id')
            ->select('modules.id', 'modules.name', 'module_groupe.groupe_id')
            ->get();

        $result = [];
        foreach ($modules as $module) {
            $total = Progression::where('module_id', $module->id)->where('groupe_id', $module->groupe_id)->count();
            $completed = Progression::where('module_id', $module->id)->where('groupe_id', $module->groupe_id)->where('status', 'completed')->count();
            $percent = $total > 0 ? round($completed / $total * 100, 1) : 0;
            $result[] = [
                'module_id' => $module->id,
                'module' => $module->name,
                'completed_count' => $completed,
                'total_count' => $total,
                'progress_percent' => $percent,
            ];
        }

        return $this->success([
            'stagiaire_id' => $stagiaire->id,
            'by_module' => $result,
        ]);
    }
}

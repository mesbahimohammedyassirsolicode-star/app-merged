<?php

namespace App\Analytics\Security;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class AnalyticsScopeResolver
{
    public function resolve(User $user): array
    {
        if (in_array($user->role, ['admin', 'directeur', 'secretariat'], true)) {
            return [
                'scope_type' => 'tenant_full',
                'student_ids' => DB::table('stagiaires')->pluck('user_id')->filter()->values()->all(),
                'student_record_ids' => DB::table('stagiaires')->pluck('id')->filter()->values()->all(),
                'group_ids' => DB::table('groupes')->pluck('id')->values()->all(),
                'module_ids' => DB::table('modules')->pluck('id')->values()->all(),
                'filiere_ids' => DB::table('filieres')->pluck('id')->values()->all(),
                'masked' => false,
            ];
        }

        if (in_array($user->role, ['teacher', 'formateur'], true)) {
            $rows = DB::table('formateur_module_group')
                ->where('user_id', $user->id)
                ->get(['module_id', 'groupe_id']);

            $groupIds = $rows->pluck('groupe_id')->filter()->unique()->values();
            $studentRows = DB::table('stagiaires')
                ->whereIn('groupe_id', $groupIds)
                ->get(['id', 'user_id', 'filiere_id']);

            return [
                'scope_type' => 'trainer_assigned_groups',
                'student_ids' => $studentRows->pluck('user_id')->filter()->values()->all(),
                'student_record_ids' => $studentRows->pluck('id')->filter()->values()->all(),
                'group_ids' => $groupIds->all(),
                'module_ids' => $rows->pluck('module_id')->filter()->unique()->values()->all(),
                'filiere_ids' => $studentRows->pluck('filiere_id')->filter()->unique()->values()->all(),
                'masked' => false,
            ];
        }

        if ($user->role === 'parent') {
            $parent = $user->parent;
            $stagiaires = $parent
                ? $parent->stagiaires()->get(['stagiaires.id', 'stagiaires.user_id', 'stagiaires.groupe_id', 'stagiaires.filiere_id'])
                : collect();

            $groupIds = $stagiaires->pluck('groupe_id')->filter()->unique()->values();
            $moduleIds = DB::table('module_groupe')
                ->whereIn('groupe_id', $groupIds)
                ->pluck('module_id')
                ->filter()
                ->unique()
                ->values();

            return [
                'scope_type' => 'parent_children',
                'student_ids' => $stagiaires->pluck('user_id')->filter()->values()->all(),
                'student_record_ids' => $stagiaires->pluck('id')->filter()->values()->all(),
                'group_ids' => $groupIds->all(),
                'module_ids' => $moduleIds->all(),
                'filiere_ids' => $stagiaires->pluck('filiere_id')->filter()->unique()->values()->all(),
                'masked' => false,
            ];
        }

        $student = $user->stagiaire;
        $moduleIds = $student?->groupe_id
            ? DB::table('module_groupe')->where('groupe_id', $student->groupe_id)->pluck('module_id')->filter()->unique()->values()->all()
            : [];

        return [
            'scope_type' => 'self',
            'student_ids' => array_values(array_filter([$student?->user_id])),
            'student_record_ids' => array_values(array_filter([$student?->id])),
            'group_ids' => array_values(array_filter([$student?->groupe_id])),
            'module_ids' => $moduleIds,
            'filiere_ids' => array_values(array_filter([$student?->filiere_id])),
            'masked' => false,
        ];
    }
}

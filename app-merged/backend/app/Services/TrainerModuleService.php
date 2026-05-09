<?php

namespace App\Services;

use App\Models\Module;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class TrainerModuleService
{
    /**
     * @return Collection<int, Module>
     */
    public function getTrainerModules(User $user): Collection
    {
        $moduleIds = $this->resolveTrainerModuleIds($user);
        if ($moduleIds === []) {
            return new Collection();
        }

        return Module::query()
            ->whereIn('modules.id', $moduleIds)
            ->with([
                'groups:id,label,filiere_id',
                'groups.students:id,user_id,groupe_id',
                'groups.students.user:id,name',
            ])
            ->select('modules.id', 'modules.code', 'modules.label', 'modules.filiere_id')
            ->get();
    }

    public function canAccessModule(User $user, int $moduleId): bool
    {
        return in_array($moduleId, $this->resolveTrainerModuleIds($user), true);
    }

    /**
     * Resolve assigned modules across canonical + legacy assignment tables.
     *
     * @return array<int>
     */
    private function resolveTrainerModuleIds(User $user): array
    {
        $fromUserModulesRelation = $user->modules()
            ->pluck('modules.id')
            ->map(fn ($id) => (int) $id)
            ->all();

        $fromCanonical = [];
        if (Schema::hasTable('module_trainer')) {
            $fromCanonical = DB::table('module_trainer')
                ->where('user_id', $user->id)
                ->pluck('module_id')
                ->map(fn ($id) => (int) $id)
                ->all();
        }

        $fromLegacyUserPivot = [];
        if (Schema::hasTable('formateur_module')) {
            $fromLegacyUserPivot = DB::table('formateur_module')
                ->where('user_id', $user->id)
                ->pluck('module_id')
                ->map(fn ($id) => (int) $id)
                ->all();
        }

        $fromScopedAssignments = [];
        if (Schema::hasTable('formateur_module_group')) {
            $fromScopedAssignments = DB::table('formateur_module_group')
                ->where('user_id', $user->id)
                ->pluck('module_id')
                ->map(fn ($id) => (int) $id)
                ->all();
        }

        $fromTeacherModule = [];
        $formateurId = (int) ($user->formateur?->id ?? 0);
        if ($formateurId > 0 && Schema::hasTable('teacher_module')) {
            $fromTeacherModule = DB::table('teacher_module')
                ->where('teacher_id', $formateurId)
                ->pluck('module_id')
                ->map(fn ($id) => (int) $id)
                ->all();
        }

        return array_values(array_unique(array_merge(
            $fromUserModulesRelation,
            $fromCanonical,
            $fromLegacyUserPivot,
            $fromScopedAssignments,
            $fromTeacherModule
        )));
    }
}


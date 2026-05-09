<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\TrainerModuleService;
use Illuminate\Http\Request;

class TrainerModuleController extends Controller
{
    public function __construct(
        private TrainerModuleService $trainerModuleService
    ) {}

    public function index(Request $request)
    {
        $user = auth()->user();
        if (! $user) {
            return $this->error('Non authentifie.', 401);
        }

        $role = strtolower(trim((string) $user->role));
        if (! in_array($role, ['teacher', 'formateur'], true) && ! $user->hasRole('teacher') && ! $user->hasRole('formateur')) {
            return $this->error('Acces refuse.', 403);
        }

        $modules = $this->trainerModuleService->getTrainerModules($user)
            ->map(function ($module) {
                $groups = $module->groups->map(function ($group) {
                    return [
                        'id' => (int) $group->id,
                        'label' => (string) $group->label,
                        'students' => $group->students->map(fn ($stagiaire) => [
                            'id' => (int) $stagiaire->id,
                            'name' => (string) ($stagiaire->user?->name ?? ''),
                        ])->values(),
                    ];
                })->values();

                return [
                    'id' => (int) $module->id,
                    'code' => (string) $module->code,
                    'label' => (string) $module->label,
                    'groups' => $groups,
                    'groupes' => $groups,
                ];
            })
            ->values();

        return $this->success($modules);
    }
}


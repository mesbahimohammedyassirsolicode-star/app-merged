<?php

namespace App\Services;

use App\Models\Groupe;
use App\Models\Module;
use App\Models\Stagiaire;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;

/**
 * Scoped group overview for stagiaires: only their own groupe — no global enumeration.
 */
class GroupService
{
    public function __construct(
        private readonly ScheduleService $scheduleService,
    ) {}

    /**
     * Aggregates groupe, camarades, timetable (scoped to groupe + filière rules), and modules (filière ∪ groupe).
     *
     * @return array<string, mixed>
     */
    public function getOverviewForAuthenticatedStagiaire(User $user, ?string $weekStart): array
    {
        [$start, $end] = $this->resolveWeekRange($weekStart);

        $emptyTimetable = [
            'week_start' => $start->toDateString(),
            'week_end' => $end->toDateString(),
            'rows' => collect(),
            'by_date' => [],
        ];

        if (! $this->isStudentRole($user->role)) {
            return [
                'group' => null,
                'members' => collect(),
                'modules' => collect(),
                'timetable' => $emptyTimetable,
            ];
        }

        $user->loadMissing('stagiaire.groupe.filiere', 'stagiaire.groupe.niveau', 'stagiaire.filiere');
        $stagiaire = $user->stagiaire;

        if (! $stagiaire || ! $stagiaire->groupe_id) {
            return [
                'group' => null,
                'members' => collect(),
                'modules' => collect(),
                'timetable' => $emptyTimetable,
            ];
        }

        $groupeId = (int) $stagiaire->groupe_id;

        /** @var Groupe|null $groupe */
        $groupe = Groupe::query()
            ->whereKey($groupeId)
            ->with(['filiere', 'niveau.filiere'])
            ->first();

        if (! $groupe) {
            return [
                'group' => null,
                'members' => collect(),
                'modules' => collect(),
                'timetable' => $emptyTimetable,
            ];
        }

        $filiereScope = $stagiaire->getFiliereIdForScope();

        $scheduleResult = $this->scheduleService->fetchWeeklySchedules(
            $start,
            $end,
            collect([$groupeId]),
            $groupeId,
            $filiereScope
        );

        $members = Stagiaire::query()
            ->where('groupe_id', $groupeId)
            ->with(['user:id,name,email'])
            ->orderBy('id')
            ->get();

        $modules = $this->resolveModulesForGroupe($groupe, $filiereScope);

        return [
            'group' => $groupe,
            'members' => $members,
            'modules' => $modules,
            'timetable' => [
                'week_start' => (string) ($scheduleResult['week_start'] ?? $start->toDateString()),
                'week_end' => (string) ($scheduleResult['week_end'] ?? $end->toDateString()),
                'rows' => $scheduleResult['rows'] ?? collect(),
                'by_date' => $scheduleResult['by_date'] ?? [],
            ],
        ];
    }

    /**
     * Modules from the filière catalog plus any explicitly attached to the groupe (pivot).
     *
     * @return Collection<int, Module>
     */
    private function resolveModulesForGroupe(Groupe $groupe, ?int $filiereId): Collection
    {
        $fromGroupe = $groupe->modules()
            ->with(['niveau', 'filiere'])
            ->orderBy('semester')
            ->orderBy('code')
            ->get();

        if ($filiereId === null) {
            return $fromGroupe->unique('id')->values();
        }

        $fromFiliere = Module::query()
            ->where('filiere_id', $filiereId)
            ->with(['niveau', 'filiere'])
            ->orderBy('semester')
            ->orderBy('code')
            ->get();

        return $fromFiliere
            ->concat($fromGroupe)
            ->unique('id')
            ->sortBy(fn (Module $m) => [(string) ($m->semester ?? ''), (string) ($m->code ?? '')])
            ->values();
    }

    /**
     * @return array{0: Carbon, 1: Carbon}
     */
    private function resolveWeekRange(?string $weekStart): array
    {
        try {
            $start = $weekStart
                ? Carbon::parse($weekStart)->startOfWeek(Carbon::MONDAY)->startOfDay()
                : Carbon::now()->startOfWeek(Carbon::MONDAY)->startOfDay();
        } catch (\Throwable) {
            $start = Carbon::now()->startOfWeek(Carbon::MONDAY)->startOfDay();
        }

        return [$start, $start->copy()->addDays(6)->endOfDay()];
    }

    private function isStudentRole(?string $role): bool
    {
        return $role === 'student' || $role === 'stagiaire';
    }
}

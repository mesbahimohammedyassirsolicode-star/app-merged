<?php

namespace App\Services;

use App\Models\Module;
use App\Models\Seance;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class StagiaireService
{
    public function __construct(
        private readonly ScheduleService $scheduleService,
    ) {}

    /**
     * Modules belonging to the stagiaire's filière only (no cross-filière leakage).
     */
    public function getModulesForAuthenticatedUser(User $user): Collection
    {
        if (! $this->isStudentRole($user->role)) {
            return collect();
        }

        $user->loadMissing('stagiaire.groupe.niveau', 'stagiaire.groupes');
        $stagiaire = $user->stagiaire;
        if (! $stagiaire) {
            return collect();
        }

        $filiereId = $stagiaire->getFiliereIdForScope();
        if ($filiereId === null) {
            return collect();
        }

        return Module::query()
            ->where('filiere_id', $filiereId)
            ->with(['niveau', 'filiere'])
            ->orderBy('semester')
            ->orderBy('code')
            ->get();
    }

    /**
     * Emploi du temps scoped to the stagiaire's filière (same rules as GET /timetable for students).
     *
     * @return array{week_start: string, week_end: string, seances: array<int, array<string, mixed>>, by_date: array<string, array<int, array<string, mixed>>>}
     */
    public function getTimetablePayloadForAuthenticatedUser(User $user, ?string $weekStart): array
    {
        try {
            $weekStartInput = $weekStart;
            $date = $weekStartInput ? Carbon::parse($weekStartInput) : Carbon::now()->startOfWeek(Carbon::MONDAY);
            $start = $date->copy()->startOfDay();
            $end = $date->copy()->addDays(6)->endOfDay();
        } catch (\Throwable) {
            $start = Carbon::now()->startOfWeek(Carbon::MONDAY)->startOfDay();
            $end = $start->copy()->addDays(6)->endOfDay();

            return $this->emptyPayload($start, $end);
        }

        if (! $this->isStudentRole($user->role)) {
            return $this->emptyPayload($start, $end);
        }

        $user->loadMissing('stagiaire.groupe.niveau', 'stagiaire.groupes');
        $stagiaire = $user->stagiaire;
        if (! $stagiaire) {
            return $this->emptyPayload($start, $end);
        }

        $filiereId = $stagiaire->getFiliereIdForScope();
        if ($filiereId === null) {
            return $this->emptyPayload($start, $end);
        }

        $query = $this->scheduleService->querySchedulesForStudentFiliere($filiereId);

        try {
            $allForScope = (clone $query)->get();
        } catch (\Throwable) {
            return $this->emptyPayload($start, $end);
        }

        $startStr = $start->format('Y-m-d');
        $endStr = $end->format('Y-m-d');

        $seancesForWeek = $allForScope->filter(function ($s) use ($startStr, $endStr) {
            $d = is_object($s->date) ? $s->date->format('Y-m-d') : (string) $s->date;

            return $d >= $startStr && $d <= $endStr;
        });

        if ($this->isStudentRole($user->role) && $seancesForWeek->isEmpty() && $allForScope->isNotEmpty()) {
            $firstDate = $allForScope->min('date');
            if ($firstDate) {
                $d = Carbon::parse($firstDate);
                $start = $d->copy()->startOfWeek(Carbon::MONDAY)->startOfDay();
                $end = $start->copy()->addDays(6)->endOfDay();
                $startStr = $start->format('Y-m-d');
                $endStr = $end->format('Y-m-d');
                $seancesForWeek = $allForScope->filter(function ($s) use ($startStr, $endStr) {
                    $d = is_object($s->date) ? $s->date->format('Y-m-d') : (string) $s->date;

                    return $d >= $startStr && $d <= $endStr;
                });
            }
        }

        $formatted = $seancesForWeek->map(fn (Seance $s) => $this->formatSeanceForStagiaire($s))->values();

        $byDate = $formatted
            ->groupBy(fn (array $s) => (string) $s['date'])
            ->map(fn (Collection $items) => $items->values()->all())
            ->toArray();

        return [
            'week_start' => $start->format('Y-m-d'),
            'week_end' => $end->format('Y-m-d'),
            'seances' => $formatted->all(),
            'by_date' => $byDate,
        ];
    }

    /**
     * @return array{week_start: string, week_end: string, seances: array<int, mixed>, by_date: object}
     */
    private function emptyPayload(Carbon $start, Carbon $end): array
    {
        return [
            'week_start' => $start->format('Y-m-d'),
            'week_end' => $end->format('Y-m-d'),
            'seances' => [],
            'by_date' => (object) [],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function formatSeanceForStagiaire(Seance $seance): array
    {
        $module = $seance->module ?? $seance->affectation?->module;
        $groupe = $seance->groupe ?? $seance->affectation?->groupe;
        $teacher = $seance->user?->name ?? $seance->affectation?->formateur?->user?->name;
        $dateRaw = is_object($seance->date) ? $seance->date->format('Y-m-d') : (string) $seance->date;

        return [
            'id' => $seance->id,
            'date' => $dateRaw,
            'jour' => $this->frenchWeekdayLabel($dateRaw),
            'start_time' => (string) $seance->start_time,
            'end_time' => (string) $seance->end_time,
            'salle' => $seance->salle,
            'status' => (string) $seance->status,
            'type' => (string) $seance->type,
            'user_id' => $seance->user_id,
            'module_id' => $seance->module_id,
            'groupe_id' => $seance->groupe_id,
            'filiere_id' => $seance->filiere_id,
            'module' => $module ? [
                'id' => $module->id,
                'code' => $module->code,
                'label' => $module->label,
            ] : null,
            'groupe' => $groupe ? [
                'id' => $groupe->id,
                'label' => $groupe->label,
            ] : null,
            'teacher' => $teacher ? ['name' => $teacher] : null,
            'formateur' => $teacher ? ['name' => $teacher] : null,
        ];
    }

    private function frenchWeekdayLabel(string $dateStr): string
    {
        try {
            $w = (int) Carbon::parse($dateStr)->format('w');
        } catch (\Throwable) {
            return '';
        }

        return match ($w) {
            0 => 'Dimanche',
            1 => 'Lundi',
            2 => 'Mardi',
            3 => 'Mercredi',
            4 => 'Jeudi',
            5 => 'Vendredi',
            6 => 'Samedi',
            default => '',
        };
    }

    private function isStudentRole(?string $role): bool
    {
        return $role === 'student' || $role === 'stagiaire';
    }
}

<?php

namespace App\Http\Resources;

use App\Models\Groupe;
use App\Models\Module;
use App\Models\Stagiaire;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Collection;

/**
 * @property array<string, mixed> $resource
 */
class StagiaireGroupOverviewResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var Groupe|null $group */
        $group = $this->resource['group'];

        /** @var Collection<int, Stagiaire> $members */
        $members = $this->resource['members'];

        /** @var Collection<int, Module> $modules */
        $modules = $this->resource['modules'];

        $timetable = $this->resource['timetable'];
        $rows = $timetable['rows'] ?? collect();

        if ($group === null) {
            return [
                'group' => null,
                'members' => [],
                'timetable' => [
                    'week_start' => (string) ($timetable['week_start'] ?? ''),
                    'week_end' => (string) ($timetable['week_end'] ?? ''),
                    'seances' => [],
                    'by_date' => (object) [],
                ],
                'modules' => [],
            ];
        }

        $filiere = $group->filiere;

        $schedules = ScheduleResource::collection($rows)->resolve();

        $byDate = collect($schedules)
            ->groupBy('date')
            ->map(fn (Collection $items) => $items->values()->all())
            ->toArray();

        return [
            'group' => [
                'id' => $group->id,
                'name' => $group->label ?? $group->name,
                'label' => $group->label ?? $group->name,
                'year_level' => $group->year_level,
                'filiere' => $filiere ? [
                    'id' => $filiere->id,
                    'code' => $filiere->code,
                    'label' => $filiere->label ?? $filiere->name,
                ] : null,
            ],
            'members' => StagiaireGroupMemberResource::collection($members),
            'timetable' => [
                'week_start' => $timetable['week_start'] ?? '',
                'week_end' => $timetable['week_end'] ?? '',
                'seances' => $schedules,
                'by_date' => $byDate,
            ],
            'modules' => StagiaireModuleResource::collection($modules),
        ];
    }
}

<?php

namespace App\Services;

use App\Models\AnneeScolaire;
use App\Models\Filiere;
use App\Models\Groupe;
use App\Models\Module;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class FiliereGroupStandardizationService
{
    private const TARGET_GROUP_LABELS = [
        1 => '1ère année',
        2 => '2ème année',
    ];

    /**
     * @return array<string, mixed>
     */
    public function standardize(Filiere $filiere, ?int $academicYearId = null): array
    {
        return DB::transaction(function () use ($filiere, $academicYearId) {
            $activeGroups = $filiere->groupes()->orderBy('id')->get();
            $modules = $filiere->modules()->orderBy('code')->get();

            $resolvedAcademicYearId = $academicYearId ?? $this->resolveAcademicYearId($activeGroups);
            $resolvedNiveauId = $this->resolveNiveauId($filiere, $activeGroups, $modules);
            $oldGroupIds = $activeGroups->pluck('id')->map(fn ($id) => (int) $id)->values();

            $backup = [
                'filiere' => [
                    'id' => (int) $filiere->id,
                    'code' => (string) ($filiere->code ?? ''),
                    'label' => (string) ($filiere->label ?? $filiere->name ?? ''),
                ],
                'groups' => $activeGroups->map(fn (Groupe $group) => [
                    'id' => (int) $group->id,
                    'label' => (string) ($group->label ?? $group->name ?? ''),
                    'year_level' => $group->year_level !== null ? (int) $group->year_level : null,
                    'annee_scolaire_id' => $group->annee_scolaire_id !== null ? (int) $group->annee_scolaire_id : null,
                    'capacity' => $group->capacity !== null ? (int) $group->capacity : null,
                ])->values()->all(),
                'module_group_links' => $oldGroupIds->isEmpty()
                    ? []
                    : DB::table('module_groupe')
                        ->whereIn('groupe_id', $oldGroupIds->all())
                        ->orderBy('module_id')
                        ->get()
                        ->map(fn ($row) => [
                            'module_id' => (int) $row->module_id,
                            'groupe_id' => (int) $row->groupe_id,
                            'academic_year' => $row->academic_year !== null ? (int) $row->academic_year : null,
                            'semester' => $row->semester,
                            'planned_hours' => $row->planned_hours !== null ? (int) $row->planned_hours : null,
                        ])
                        ->values()
                        ->all(),
            ];

            $targetGroups = collect([1, 2])->mapWithKeys(function (int $yearLevel) use ($filiere, $resolvedAcademicYearId, $resolvedNiveauId, $activeGroups) {
                $group = Groupe::query()->create([
                    'niveau_id' => $resolvedNiveauId,
                    'filiere_id' => $filiere->id,
                    'annee_scolaire_id' => $resolvedAcademicYearId,
                    'name' => self::TARGET_GROUP_LABELS[$yearLevel],
                    'label' => self::TARGET_GROUP_LABELS[$yearLevel],
                    'year_level' => $yearLevel,
                    'capacity' => $this->resolveCapacityForYear($activeGroups, $yearLevel),
                ]);

                return [$yearLevel => $group];
            });

            $oldGroupYearMap = $activeGroups->mapWithKeys(function (Groupe $group) {
                return [(int) $group->id => $this->resolveGroupYearLevel($group)];
            })->all();

            $studentSummary = $this->remapStudents($oldGroupYearMap, $targetGroups);
            $moduleSummary = $this->remapModules($modules, $oldGroupIds, $oldGroupYearMap, $targetGroups, $resolvedAcademicYearId);
            $trainerSummary = $this->remapTrainerGroups($oldGroupYearMap, $targetGroups);

            if ($oldGroupIds->isNotEmpty()) {
                Groupe::query()->whereIn('id', $oldGroupIds->all())->delete();
            }

            return [
                'backup' => $backup,
                'created_groups' => $targetGroups->map(fn (Groupe $group) => [
                    'id' => (int) $group->id,
                    'label' => (string) ($group->label ?? $group->name ?? ''),
                    'year_level' => (int) $group->year_level,
                    'annee_scolaire_id' => $group->annee_scolaire_id !== null ? (int) $group->annee_scolaire_id : null,
                ])->values()->all(),
                'student_assignments' => $studentSummary,
                'module_assignments' => $moduleSummary['summary'],
                'trainer_assignments' => $trainerSummary,
                'manual_review' => [
                    'ambiguous_modules' => $moduleSummary['ambiguous_modules'],
                ],
            ];
        });
    }

    /**
     * @param  array<int, int|null>  $oldGroupYearMap
     * @param  Collection<int, Groupe>  $targetGroups
     * @return array<string, int>
     */
    private function remapStudents(array $oldGroupYearMap, Collection $targetGroups): array
    {
        $primaryUpdates = 0;
        $pivotUpserts = 0;
        $pivotDeletes = 0;

        foreach ($oldGroupYearMap as $oldGroupId => $yearLevel) {
            $targetGroup = $yearLevel !== null ? $targetGroups->get($yearLevel) : null;
            if (! $targetGroup) {
                continue;
            }

            $primaryUpdates += DB::table('stagiaires')
                ->where('groupe_id', $oldGroupId)
                ->update(['groupe_id' => $targetGroup->id]);

            $pivotRows = DB::table('groupe_stagiaire')
                ->where('groupe_id', $oldGroupId)
                ->get(['stagiaire_id']);

            foreach ($pivotRows as $row) {
                DB::table('groupe_stagiaire')->updateOrInsert(
                    [
                        'groupe_id' => $targetGroup->id,
                        'stagiaire_id' => (int) $row->stagiaire_id,
                    ],
                    [
                        'updated_at' => now(),
                        'created_at' => now(),
                    ]
                );
                $pivotUpserts++;
            }

            $pivotDeletes += DB::table('groupe_stagiaire')->where('groupe_id', $oldGroupId)->delete();
        }

        return [
            'primary_group_updates' => $primaryUpdates,
            'pivot_links_created_or_updated' => $pivotUpserts,
            'pivot_links_removed_from_old_groups' => $pivotDeletes,
        ];
    }

    /**
     * @param  Collection<int, Module>  $modules
     * @param  Collection<int, int>  $oldGroupIds
     * @param  array<int, int|null>  $oldGroupYearMap
     * @param  Collection<int, Groupe>  $targetGroups
     * @return array{
     *   summary: array<string, int>,
     *   ambiguous_modules: array<int, array<string, mixed>>
     * }
     */
    private function remapModules(Collection $modules, Collection $oldGroupIds, array $oldGroupYearMap, Collection $targetGroups, ?int $academicYearId): array
    {
        $modulePivotUpserts = 0;
        $modulePivotDeletes = 0;
        $trainerScopedUpserts = 0;
        $trainerScopedDeletes = 0;
        $ambiguousModules = [];

        foreach ($modules as $module) {
            $legacyModuleLinks = $oldGroupIds->isEmpty()
                ? collect()
                : DB::table('module_groupe')
                    ->where('module_id', $module->id)
                    ->whereIn('groupe_id', $oldGroupIds->all())
                    ->get();

            $decision = $this->resolveModuleYearDecision($module, $legacyModuleLinks, $oldGroupYearMap);
            $targetGroup = $decision['year_level'] !== null ? $targetGroups->get($decision['year_level']) : null;

            if (! $targetGroup) {
                $ambiguousModules[] = [
                    'id' => (int) $module->id,
                    'code' => (string) ($module->code ?? ''),
                    'label' => (string) ($module->label ?? $module->name ?? ''),
                    'reason' => (string) $decision['reason'],
                ];
                continue;
            }

            if ($legacyModuleLinks->isNotEmpty()) {
                $uniqueScopes = $legacyModuleLinks
                    ->map(fn ($row) => [
                        'academic_year' => $row->academic_year !== null ? (int) $row->academic_year : $academicYearId,
                        'semester' => $row->semester ?? $module->semester,
                        'planned_hours' => $row->planned_hours !== null ? (int) $row->planned_hours : $module->masse_horaire,
                    ])
                    ->unique(fn (array $row) => ($row['academic_year'] ?? 0).'|'.($row['semester'] ?? ''))
                    ->values();

                foreach ($uniqueScopes as $scope) {
                    $resolvedYear = $scope['academic_year'];
                    if ($resolvedYear === null) {
                        continue;
                    }

                    DB::table('module_groupe')->updateOrInsert(
                        [
                            'module_id' => $module->id,
                            'groupe_id' => $targetGroup->id,
                            'academic_year' => $resolvedYear,
                            'semester' => $scope['semester'],
                        ],
                        [
                            'planned_hours' => $scope['planned_hours'],
                            'updated_at' => now(),
                            'created_at' => now(),
                        ]
                    );
                    $modulePivotUpserts++;
                }
            } elseif ($academicYearId !== null) {
                DB::table('module_groupe')->updateOrInsert(
                    [
                        'module_id' => $module->id,
                        'groupe_id' => $targetGroup->id,
                        'academic_year' => $academicYearId,
                        'semester' => $module->semester,
                    ],
                    [
                        'planned_hours' => $module->masse_horaire,
                        'updated_at' => now(),
                        'created_at' => now(),
                    ]
                );
                $modulePivotUpserts++;
            }

            if ($oldGroupIds->isNotEmpty()) {
                $trainerRows = DB::table('formateur_module_group')
                    ->where('module_id', $module->id)
                    ->whereIn('groupe_id', $oldGroupIds->all())
                    ->get();

                foreach ($trainerRows as $row) {
                    DB::table('formateur_module_group')->updateOrInsert(
                        [
                            'user_id' => (int) $row->user_id,
                            'module_id' => (int) $row->module_id,
                            'groupe_id' => $targetGroup->id,
                        ],
                        [
                            'updated_at' => now(),
                            'created_at' => now(),
                        ]
                    );
                    $trainerScopedUpserts++;
                }

                $trainerScopedDeletes += DB::table('formateur_module_group')
                    ->where('module_id', $module->id)
                    ->whereIn('groupe_id', $oldGroupIds->all())
                    ->delete();

                $modulePivotDeletes += DB::table('module_groupe')
                    ->where('module_id', $module->id)
                    ->whereIn('groupe_id', $oldGroupIds->all())
                    ->delete();
            }

            if ($decision['manual_review']) {
                $ambiguousModules[] = [
                    'id' => (int) $module->id,
                    'code' => (string) ($module->code ?? ''),
                    'label' => (string) ($module->label ?? $module->name ?? ''),
                    'reason' => (string) $decision['reason'],
                ];
            }
        }

        return [
            'summary' => [
                'module_group_links_created_or_updated' => $modulePivotUpserts,
                'module_group_links_removed_from_old_groups' => $modulePivotDeletes,
                'trainer_module_group_links_created_or_updated' => $trainerScopedUpserts,
                'trainer_module_group_links_removed_from_old_groups' => $trainerScopedDeletes,
            ],
            'ambiguous_modules' => $ambiguousModules,
        ];
    }

    /**
     * @param  array<int, int|null>  $oldGroupYearMap
     * @param  Collection<int, Groupe>  $targetGroups
     * @return array<string, int>
     */
    private function remapTrainerGroups(array $oldGroupYearMap, Collection $targetGroups): array
    {
        $upserts = 0;
        $deletes = 0;

        foreach ($oldGroupYearMap as $oldGroupId => $yearLevel) {
            $targetGroup = $yearLevel !== null ? $targetGroups->get($yearLevel) : null;
            if (! $targetGroup) {
                continue;
            }

            $rows = DB::table('formateur_group')
                ->where('groupe_id', $oldGroupId)
                ->get(['user_id']);

            foreach ($rows as $row) {
                DB::table('formateur_group')->updateOrInsert(
                    [
                        'user_id' => (int) $row->user_id,
                        'groupe_id' => $targetGroup->id,
                    ],
                    [
                        'updated_at' => now(),
                        'created_at' => now(),
                    ]
                );
                $upserts++;
            }

            $deletes += DB::table('formateur_group')->where('groupe_id', $oldGroupId)->delete();
        }

        return [
            'group_links_created_or_updated' => $upserts,
            'group_links_removed_from_old_groups' => $deletes,
        ];
    }

    /**
     * @param  Collection<int, Groupe>  $groups
     * @param  Collection<int, Module>  $modules
     */
    private function resolveNiveauId(Filiere $filiere, Collection $groups, Collection $modules): ?int
    {
        if ($filiere->niveau_id !== null) {
            return (int) $filiere->niveau_id;
        }

        $candidate = $groups->pluck('niveau_id')
            ->merge($modules->pluck('niveau_id'))
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->first();

        return $candidate !== null ? (int) $candidate : null;
    }

    /**
     * @param  Collection<int, Groupe>  $groups
     */
    private function resolveAcademicYearId(Collection $groups): ?int
    {
        $fromGroups = $groups->pluck('annee_scolaire_id')
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->first();

        if ($fromGroups !== null) {
            return (int) $fromGroups;
        }

        $currentYear = AnneeScolaire::query()->where('is_current', true)->value('id');
        if ($currentYear !== null) {
            return (int) $currentYear;
        }

        $latestYear = AnneeScolaire::query()->orderByDesc('year_start')->value('id');

        return $latestYear !== null ? (int) $latestYear : null;
    }

    /**
     * @param  Collection<int, Groupe>  $groups
     */
    private function resolveCapacityForYear(Collection $groups, int $yearLevel): int
    {
        $capacity = $groups
            ->filter(fn (Groupe $group) => $this->resolveGroupYearLevel($group) === $yearLevel)
            ->pluck('capacity')
            ->filter()
            ->map(fn ($value) => (int) $value)
            ->max();

        return $capacity !== null ? max(1, (int) $capacity) : 30;
    }

    private function resolveGroupYearLevel(Groupe $group): ?int
    {
        if (in_array((int) $group->year_level, [1, 2], true)) {
            return (int) $group->year_level;
        }

        return $this->inferYearLevel((string) ($group->label ?? $group->name ?? ''));
    }

    /**
     * @param  \Illuminate\Support\Collection<int, object>  $legacyModuleLinks
     * @param  array<int, int|null>  $oldGroupYearMap
     * @return array{year_level:?int, reason:string, manual_review:bool}
     */
    private function resolveModuleYearDecision(Module $module, Collection $legacyModuleLinks, array $oldGroupYearMap): array
    {
        $semesterYear = $this->inferYearLevelFromSemester($module->semester);
        if ($semesterYear !== null) {
            return [
                'year_level' => $semesterYear,
                'reason' => 'Mapped from semester '.$module->semester,
                'manual_review' => false,
            ];
        }

        $textYear = $this->inferYearLevel(trim(($module->code ?? '').' '.($module->label ?? $module->name ?? '')));
        if ($textYear !== null) {
            return [
                'year_level' => $textYear,
                'reason' => 'Mapped from module code/title pattern',
                'manual_review' => false,
            ];
        }

        $legacyYears = $legacyModuleLinks
            ->pluck('groupe_id')
            ->map(fn ($id) => $oldGroupYearMap[(int) $id] ?? null)
            ->filter()
            ->unique()
            ->values();

        if ($legacyYears->count() === 1) {
            return [
                'year_level' => (int) $legacyYears->first(),
                'reason' => 'Mapped from legacy group assignment; review recommended',
                'manual_review' => true,
            ];
        }

        return [
            'year_level' => null,
            'reason' => 'No reliable year signal found in semester, title, code, or legacy assignments',
            'manual_review' => true,
        ];
    }

    private function inferYearLevelFromSemester(?string $semester): ?int
    {
        $normalized = strtoupper(trim((string) $semester));

        return match ($normalized) {
            'S1', 'S2' => 1,
            'S3', 'S4' => 2,
            default => null,
        };
    }

    private function inferYearLevel(string $value): ?int
    {
        $normalized = Str::of($value)->lower()->ascii()->value();

        if ($normalized === '') {
            return null;
        }

        $firstYearPatterns = [
            '/\b(s1|s2|1a|1ere|1er|annee 1|first year|premiere annee|fondamentaux|introduction|initiation|bases?)\b/',
            '/\b(debutant|foundation|fundamental)\b/',
        ];

        foreach ($firstYearPatterns as $pattern) {
            if (preg_match($pattern, $normalized) === 1) {
                return 1;
            }
        }

        $secondYearPatterns = [
            '/\b(s3|s4|2a|2eme|2e|annee 2|second year|deuxieme annee|avance|approfondissement|application|projet)\b/',
            '/\b(capstone|stage|integration)\b/',
        ];

        foreach ($secondYearPatterns as $pattern) {
            if (preg_match($pattern, $normalized) === 1) {
                return 2;
            }
        }

        return null;
    }
}

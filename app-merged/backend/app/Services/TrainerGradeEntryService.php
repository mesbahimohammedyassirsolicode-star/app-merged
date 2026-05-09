<?php

namespace App\Services;

use App\Models\Evaluation;
use App\Models\Filiere;
use App\Models\Module;
use App\Models\Note;
use Illuminate\Support\Collection;

class TrainerGradeEntryService
{
    /**
     * @return Collection<int, Filiere>
     */
    public function getTrainerScopedTree(int $trainerId): Collection
    {
        $moduleIds = Module::query()
            ->whereHas('trainers', fn ($q) => $q->where('users.id', $trainerId))
            ->pluck('id');

        if ($moduleIds->isEmpty()) {
            return collect();
        }

        $gradeRows = Note::query()
            ->selectRaw('notes.stagiaire_id, evaluations.module_id, MAX(notes.valeur) as existing_grade')
            ->join('evaluations', 'evaluations.id', '=', 'notes.evaluation_id')
            ->whereIn('evaluations.module_id', $moduleIds)
            ->groupBy('notes.stagiaire_id', 'evaluations.module_id')
            ->get()
            ->keyBy(fn ($row) => $row->stagiaire_id.'-'.$row->module_id);

        $filieres = Filiere::query()
            ->whereHas('modules', fn ($q) => $q->whereIn('modules.id', $moduleIds))
            ->with([
                'groups' => function ($groupQuery) use ($moduleIds, $trainerId) {
                    $groupQuery
                        ->whereHas('modules', fn ($moduleQuery) => $moduleQuery->whereIn('modules.id', $moduleIds))
                        ->with([
                            'modules' => function ($moduleQuery) use ($moduleIds, $trainerId) {
                                $moduleQuery
                                    ->whereIn('modules.id', $moduleIds)
                                    ->whereHas('trainers', fn ($q) => $q->where('users.id', $trainerId));
                            },
                        ]);
                },
            ])
            ->orderBy('name')
            ->get();

        $filieres->each(function ($filiere) use ($gradeRows): void {
            $filiere->groups->each(function ($group) use ($gradeRows): void {
                $group->modules->each(function ($module) use ($group, $gradeRows): void {
                    $students = $group->students->map(function ($student) use ($module, $gradeRows) {
                        $student->existing_grade = optional($gradeRows->get($student->id.'-'.$module->id))->existing_grade;

                        return $student;
                    })->values();

                    $module->setRelation('students', $students);
                });
            });
        });

        return $filieres;
    }

    /**
     * @param  array<int, array{module_id:int,student_id:int,grade:float|int}>  $entries
     * @return array<int, array<string, mixed>>
     */
    public function saveBatch(int $trainerId, array $entries): array
    {
        $results = [];

        foreach ($entries as $index => $entry) {
            $module = Module::query()
                ->where('id', $entry['module_id'])
                ->whereHas('trainers', fn ($q) => $q->where('users.id', $trainerId))
                ->first();

            if (! $module) {
                abort(403, 'You are not allowed to submit grades for this module.');
            }

            $evaluation = Evaluation::query()->firstOrCreate(
                [
                    'module_id' => (int) $entry['module_id'],
                    'groupe_id' => null,
                    'user_id' => $trainerId,
                    'item_label' => 'Trainer Grade Entry',
                    'type' => 'cc',
                ],
                [
                    'date' => now()->toDateString(),
                    'coefficient' => 1,
                    'max_points' => 20,
                ]
            );

            $note = Note::query()->updateOrCreate(
                [
                    'evaluation_id' => $evaluation->id,
                    'stagiaire_id' => (int) $entry['student_id'],
                ],
                [
                    'valeur' => (float) $entry['grade'],
                ]
            );

            $results[] = [
                'index' => $index,
                'student_id' => (int) $entry['student_id'],
                'module_id' => (int) $entry['module_id'],
                'note_id' => (int) $note->id,
                'grade' => (float) $note->valeur,
            ];
        }

        return $results;
    }
}

<?php

namespace App\Services;

use App\Models\Evaluation;
use App\Models\Groupe;
use App\Models\Note;
use App\Models\Stagiaire;
use App\Models\User;
use Illuminate\Support\Collection;

class GradeService
{
    public function __construct(
        private NotificationService $notificationService,
        private TrainerModuleService $trainerModuleService
    ) {}

    public function listByModuleAndGroup(User $actor, int $moduleId, int $groupeId): Collection
    {
        $this->ensureModuleAccess($actor, $moduleId);

        $group = Groupe::query()
            ->with(['stagiaires.user:id,name'])
            ->findOrFail($groupeId);

        $notesByStudent = Note::query()
            ->whereHas('evaluation', function ($q) use ($moduleId, $groupeId) {
                $q->where('module_id', $moduleId)->where('groupe_id', $groupeId);
            })
            ->with('evaluation:id,max_points,module_id,groupe_id')
            ->get()
            ->groupBy('stagiaire_id');

        return $group->stagiaires->map(function (Stagiaire $stagiaire) use ($notesByStudent) {
            $studentNotes = $notesByStudent->get($stagiaire->id, collect());
            $normalized = $studentNotes
                ->filter(fn (Note $note) => (float) ($note->evaluation?->max_points ?? 0) > 0)
                ->map(fn (Note $note) => ((float) $note->valeur / (float) $note->evaluation->max_points) * 20);

            $average = $normalized->isNotEmpty() ? round($normalized->avg(), 2) : null;

            return [
                'stagiaire_id' => (int) $stagiaire->id,
                'student_name' => (string) ($stagiaire->user?->name ?? 'Unknown'),
                'grade' => $average,
                'status' => $average !== null && $average >= 10 ? 'Passed' : 'Failed',
            ];
        })->values();
    }

    public function upsert(User $actor, array $payload): array
    {
        $this->ensureModuleAccess($actor, (int) $payload['module_id']);

        $evaluation = Evaluation::query()->firstOrCreate(
            [
                'module_id' => (int) $payload['module_id'],
                'groupe_id' => (int) $payload['groupe_id'],
                'user_id' => (int) $actor->id,
                'item_label' => (string) ($payload['item_label'] ?? 'Note globale'),
                'type' => (string) ($payload['type'] ?? 'cc'),
            ],
            [
                'date' => $payload['date'] ?? now()->toDateString(),
                'coefficient' => 1,
                'max_points' => 20,
            ]
        );

        $note = Note::query()->updateOrCreate(
            [
                'evaluation_id' => (int) $evaluation->id,
                'stagiaire_id' => (int) $payload['stagiaire_id'],
            ],
            [
                'valeur' => (float) $payload['valeur'],
            ]
        );

        $studentUser = Stagiaire::query()
            ->where('id', (int) $payload['stagiaire_id'])
            ->with('user:id,name')
            ->first()?->user;

        if ($studentUser) {
            $this->notificationService->notifyStudentAndParent(
                $studentUser,
                'Nouvelle note disponible',
                'Une nouvelle note a ete ajoutee pour '.$studentUser->name.'.',
                'grade_added',
                null,
                [],
                [
                    'evaluation_id' => (int) $evaluation->id,
                    'module_id' => (int) $payload['module_id'],
                    'groupe_id' => (int) $payload['groupe_id'],
                    'grade' => (float) $note->valeur,
                ]
            );
        }

        return [
            'evaluation_id' => (int) $evaluation->id,
            'note_id' => (int) $note->id,
            'stagiaire_id' => (int) $note->stagiaire_id,
            'valeur' => (float) $note->valeur,
            'status' => (float) $note->valeur >= 10 ? 'Passed' : 'Failed',
        ];
    }

    private function ensureModuleAccess(User $actor, int $moduleId): void
    {
        if ($actor->role === 'admin') {
            return;
        }

        if (! in_array($actor->role, ['trainer', 'teacher', 'formateur'], true)) {
            abort(403, 'Acces refuse.');
        }

        if (! $this->trainerModuleService->canAccessModule($actor, $moduleId)) {
            abort(403, 'Module non autorise pour ce formateur.');
        }
    }
}

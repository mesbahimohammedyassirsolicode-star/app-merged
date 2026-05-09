<?php

namespace App\Services;

use App\Models\CourseFile;
use App\Models\Filiere;
use App\Models\Formateur;
use App\Models\Module;
use App\Models\Stage;
use App\Models\Stagiaire;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\Builder;

class ObjectScopeService
{
    public function scopeStagesFor(User $user): Builder
    {
        $query = Stage::query()->with(['stagiaire.user', 'groupe', 'formateur.user']);
        $role = strtolower((string) $user->role);
        $userId = (int) $user->id;

        if (in_array($role, ['admin', 'directeur', 'secretariat'], true)) {
            return $query;
        }

        if (in_array($role, ['teacher', 'formateur'], true)) {
            return $query->whereHas('formateur', fn (Builder $f) => $f->where('user_id', $userId));
        }

        if (in_array($role, ['student', 'stagiaire'], true)) {
            return $query->whereHas('stagiaire', fn (Builder $s) => $s->where('user_id', $userId));
        }

        return $query->whereRaw('1 = 0');
    }

    public function findScopedStageOrFail(User $user, int $stageId): Stage
    {
        $stage = $this->scopeStagesFor($user)->whereKey($stageId)->first();
        if (! $stage) {
            throw new AuthorizationException('Forbidden.');
        }

        return $stage;
    }

    public function assertCanCreateStage(User $user, ?int $formateurId): void
    {
        if (! in_array((string) $user->role, ['teacher', 'formateur'], true) || $formateurId === null) {
            return;
        }

        $ownsTargetFormateur = Formateur::query()
            ->whereKey($formateurId)
            ->whereHas('user', fn (Builder $u) => $u->where('id', (int) $user->id))
            ->exists();

        if (! $ownsTargetFormateur) {
            throw new AuthorizationException('Forbidden.');
        }
    }

    public function findScopedStagiaireOrFail(User $user, int $stagiaireId): Stagiaire
    {
        $query = Stagiaire::query()->with(['user', 'filiere', 'groupe', 'notes.module', 'absences.seance.module']);
        $role = strtolower((string) $user->role);
        $userId = (int) $user->id;

        if (in_array($role, ['teacher', 'formateur'], true)) {
            $query->whereHas('stages.formateur', fn (Builder $f) => $f->where('user_id', $userId));
        } elseif (in_array($role, ['student', 'stagiaire'], true)) {
            $query->where('user_id', $userId);
        } elseif ($role === 'parent') {
            $query->whereHas('parents', fn (Builder $p) => $p->where('user_id', $userId));
        }

        $student = $query->whereKey($stagiaireId)->first();
        if (! $student) {
            throw new AuthorizationException('Forbidden.');
        }

        return $student;
    }

    public function assertCanReadTimetableCode(User $user, string $filiereCode): void
    {
        if ($filiereCode === '') {
            return;
        }

        $role = strtolower((string) $user->role);
        if (in_array($role, ['admin', 'directeur', 'secretariat'], true)) {
            return;
        }

        $query = Filiere::query()->whereRaw('UPPER(code) = ?', [strtoupper($filiereCode)]);
        $userId = (int) $user->id;

        if (in_array($role, ['teacher', 'formateur'], true)) {
            $formateurId = (int) ($user->formateur?->id ?? 0);
            $query->whereHas('modules', function (Builder $m) use ($userId, $formateurId) {
                $m->whereHas('trainers', fn (Builder $t) => $t->where('users.id', $userId))
                    ->orWhereExists(function ($sq) use ($formateurId) {
                        $sq->selectRaw('1')
                            ->from('teacher_module')
                            ->whereColumn('teacher_module.module_id', 'modules.id')
                            ->where('teacher_module.teacher_id', $formateurId);
                    });
            });
        } elseif (in_array($role, ['student', 'stagiaire'], true)) {
            $query->whereHas('groupes.stagiaires', fn (Builder $s) => $s->where('user_id', $userId));
        } elseif ($role === 'parent') {
            $query->whereHas('groupes.stagiaires.parents', fn (Builder $p) => $p->where('user_id', $userId));
        } else {
            $query->whereRaw('1 = 0');
        }

        if (! $query->exists()) {
            throw new AuthorizationException('Forbidden.');
        }
    }

    public function canAccessCourseFile(User $user, CourseFile $file): bool
    {
        $role = strtolower((string) $user->role);
        if (in_array($role, ['admin', 'directeur', 'secretariat'], true)) {
            return true;
        }

        $query = CourseFile::query()->whereKey($file->id);
        $userId = (int) $user->id;

        if (in_array($role, ['teacher', 'formateur'], true)) {
            $formateurId = (int) ($user->formateur?->id ?? 0);

            return $query
                ->whereHas('module', function (Builder $m) use ($userId, $formateurId) {
                    $m->whereHas('trainers', fn (Builder $t) => $t->where('users.id', $userId))
                        ->orWhereExists(function ($sq) use ($formateurId) {
                            $sq->selectRaw('1')
                                ->from('teacher_module')
                                ->whereColumn('teacher_module.module_id', 'modules.id')
                                ->where('teacher_module.teacher_id', $formateurId);
                        });
                })
                ->exists();
        }

        if (in_array($role, ['student', 'stagiaire'], true)) {
            return $query
                ->whereHas('groupe.stagiaires', fn (Builder $s) => $s->where('user_id', $userId))
                ->exists();
        }

        if ($role === 'parent') {
            return $query
                ->whereHas('groupe.stagiaires.parents', fn (Builder $p) => $p->where('user_id', $userId))
                ->exists();
        }

        return false;
    }

    /**
     * Filière codes present in timetable JSON files under database/data.
     *
     * @return list<string>
     */
    public function allTimetableJsonFiliereCodes(): array
    {
        $dir = database_path('data');
        if (! is_dir($dir)) {
            return [];
        }

        $files = glob($dir.DIRECTORY_SEPARATOR.'*_emploi_*.json');
        if (! is_array($files)) {
            return [];
        }

        $codes = [];
        foreach ($files as $file) {
            $contents = @file_get_contents($file);
            if ($contents === false) {
                continue;
            }
            $decoded = json_decode($contents, true);
            if (! is_array($decoded)) {
                continue;
            }
            $code = strtoupper(trim((string) (($decoded['meta'] ?? [])['filiere_code'] ?? '')));
            if ($code !== '') {
                $codes[] = $code;
            }
        }

        return array_values(array_unique($codes));
    }

    /**
     * Filière codes the user may discover for timetable JSON (narrower than viewAny filière policy).
     *
     * @return list<string>
     */
    public function accessibleTimetableFiliereCodes(User $user): array
    {
        $all = $this->allTimetableJsonFiliereCodes();
        $role = strtolower((string) $user->role);
        $userId = (int) $user->id;

        if (in_array($role, ['admin', 'directeur', 'secretariat'], true)) {
            return $all;
        }

        if (in_array($role, ['teacher', 'formateur'], true)) {
            $formateurId = (int) ($user->formateur?->id ?? 0);
            $filiereIds = Module::query()
                ->where(function (Builder $m) use ($userId, $formateurId) {
                    $m->whereHas('trainers', fn (Builder $t) => $t->where('users.id', $userId));
                    if ($formateurId > 0) {
                        $m->orWhereExists(function ($sq) use ($formateurId) {
                            $sq->selectRaw('1')
                                ->from('teacher_module')
                                ->whereColumn('teacher_module.module_id', 'modules.id')
                                ->where('teacher_module.teacher_id', $formateurId);
                        });
                    }
                })
                ->pluck('filiere_id')
                ->filter()
                ->unique()
                ->all();

            if ($filiereIds === []) {
                return [];
            }

            $codes = Filiere::query()->whereIn('id', $filiereIds)->pluck('code')
                ->map(fn ($c) => strtoupper(trim((string) $c)))
                ->filter()
                ->all();

            return array_values(array_intersect($all, $codes));
        }

        if (in_array($role, ['student', 'stagiaire'], true)) {
            $user->loadMissing('stagiaire.filiere', 'stagiaire.groupe.filiere');
            $code = strtoupper(trim((string) (
                $user->stagiaire?->filiere?->code
                ?? $user->stagiaire?->groupe?->filiere?->code
                ?? ''
            )));

            return ($code !== '' && in_array($code, $all, true)) ? [$code] : [];
        }

        if ($role === 'parent') {
            $user->loadMissing('parent');
            $codes = [];
            foreach ($user->parent?->stagiaires()->with(['filiere', 'groupe.filiere'])->get() ?? [] as $stagiaire) {
                $c = strtoupper(trim((string) (
                    $stagiaire->filiere?->code
                    ?? $stagiaire->groupe?->filiere?->code
                    ?? ''
                )));
                if ($c !== '') {
                    $codes[] = $c;
                }
            }
            $codes = array_values(array_unique($codes));

            return array_values(array_intersect($all, $codes));
        }

        return [];
    }
}

<?php

namespace App\Services;

use App\Models\CourseFile;
use App\Models\Module;
use App\Models\Stagiaire;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Filesystem\Factory as FilesystemFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CourseFileService
{
    /** @var list<string> */
    private const ALLOWED_EXTENSIONS = [
        'pdf',
        'doc', 'docx',
        'xls', 'xlsx',
        'ppt', 'pptx',
        'txt', 'rtf',
        'mp4', 'webm', 'mov', 'avi', 'mkv',
        'mp3', 'mpeg', 'wav',
    ];

    public function __construct(
        private FilesystemFactory $filesystems
    ) {}

    public function queryAccessibleFor(User $user): Builder
    {
        $q = CourseFile::query()->with([
            'uploader:id,name,email',
            'groupe:id,label,name,filiere_id',
            'groupe.filiere:id,name,label',
            'module:id,code,label,name,filiere_id',
            'module.filiere:id,name,label',
        ]);

        $role = strtolower((string) $user->role);

        if (in_array($role, ['admin', 'directeur', 'secretariat'], true)) {
            return $q;
        }

        if (in_array($role, ['teacher', 'formateur'], true)) {
            return $this->scopeForTeacher($q, $user);
        }

        if (in_array($role, ['student', 'stagiaire'], true)) {
            return $this->scopeForStudent($q, $user);
        }

        if ($role === 'parent') {
            return $this->scopeForParent($q, $user);
        }

        return $q->whereRaw('1 = 0');
    }

    public function canView(User $user, CourseFile $file): bool
    {
        $role = strtolower((string) $user->role);

        if (in_array($role, ['admin', 'directeur', 'secretariat'], true)) {
            return true;
        }

        if (in_array($role, ['teacher', 'formateur'], true)) {
            return $this->teacherCanAccessFile($user, $file);
        }

        if (in_array($role, ['student', 'stagiaire'], true)) {
            return $this->studentCanAccessFile($user, $file);
        }

        if ($role === 'parent') {
            $parent = $user->parent;
            if (! $parent) {
                return false;
            }
            foreach ($parent->children as $child) {
                if ($this->stagiaireCanAccessFile($child, $file)) {
                    return true;
                }
            }

            return false;
        }

        return false;
    }

    /**
     * Ensures non-admin staff may only publish files for groups/modules they are assigned to.
     *
     * @throws ValidationException
     */
    public function assertStaffCanAttach(User $user, ?int $groupeId, ?int $moduleId): void
    {
        $role = strtolower((string) $user->role);

        if (in_array($role, ['admin', 'directeur', 'secretariat'], true)) {
            return;
        }

        if (! in_array($role, ['teacher', 'formateur'], true)) {
            throw ValidationException::withMessages(['file' => 'Publication de fichiers non autorisée pour ce rôle.']);
        }

        $formateurId = $user->formateur?->id;
        if (! $formateurId) {
            throw ValidationException::withMessages(['file' => 'Profil formateur introuvable.']);
        }
        $fid = (int) $formateurId;
        $uid = (int) $user->id;

        if ($moduleId !== null) {
            $teaches = Module::query()
                ->whereKey($moduleId)
                ->where(function (Builder $m) use ($uid, $fid) {
                    $this->applyTrainerModuleScope($m, $uid, $fid);
                })
                ->exists();
            if (! $teaches) {
                throw new AuthorizationException('Forbidden.');
            }
        }

        if ($groupeId === null) {
            return;
        }

        $inGroup = DB::table('formateur_group')
            ->where('user_id', $uid)
            ->where('groupe_id', $groupeId)
            ->exists();

        if ($inGroup) {
            return;
        }

        if ($moduleId !== null && DB::table('module_groupe')
            ->where('groupe_id', $groupeId)
            ->where('module_id', $moduleId)
            ->exists()) {
            return;
        }

        throw new AuthorizationException('Forbidden.');
    }

    public function assertTrainerCanScopeModule(User $user, int $moduleId): void
    {
        if (! in_array((string) $user->role, ['teacher', 'formateur'], true)) {
            return;
        }

        $ownsModule = Module::query()
            ->whereKey($moduleId)
            ->where(function (Builder $m) use ($user) {
                $this->applyTrainerModuleScope($m, (int) $user->id, (int) ($user->formateur?->id ?? 0));
            })
            ->exists();

        if (! $ownsModule) {
            throw new AuthorizationException('Forbidden.');
        }
    }

    public function store(User $uploader, UploadedFile $file, array $meta): CourseFile
    {
        $ext = strtolower($file->getClientOriginalExtension() ?: $file->guessExtension() ?: '');
        if ($ext === '' || ! in_array($ext, self::ALLOWED_EXTENSIONS, true)) {
            throw new \InvalidArgumentException('Type de fichier non autorisé.');
        }

        $diskName = config('course_files.disk', 'course_files');
        $disk = $this->filesystems->disk($diskName);
        $relative = date('Y/m').'/'.Str::uuid()->toString().'.'.$ext;

        $stream = fopen($file->getRealPath(), 'r');
        if ($stream === false) {
            throw new \RuntimeException('Impossible de lire le fichier.');
        }
        try {
            $disk->writeStream($relative, $stream);
        } finally {
            if (is_resource($stream)) {
                fclose($stream);
            }
        }

        return CourseFile::create([
            'uploaded_by_user_id' => $uploader->id,
            'groupe_id' => $meta['groupe_id'] ?? null,
            'module_id' => $meta['module_id'] ?? null,
            'title' => $meta['title'] ?? null,
            'description' => $meta['description'] ?? null,
            'original_name' => $file->getClientOriginalName(),
            'disk' => $diskName,
            'path' => $relative,
            'mime_type' => $file->getClientMimeType() ?: $file->getMimeType() ?: 'application/octet-stream',
            'size_bytes' => $file->getSize(),
        ]);
    }

    public function deleteFile(CourseFile $courseFile): void
    {
        $disk = $this->filesystems->disk($courseFile->disk);
        if ($disk->exists($courseFile->path)) {
            $disk->delete($courseFile->path);
        }
        $courseFile->delete();
    }

    public function downloadResponse(CourseFile $courseFile): StreamedResponse
    {
        $disk = $this->filesystems->disk($courseFile->disk);

        if (! $disk->exists($courseFile->path)) {
            abort(404, 'Fichier introuvable sur le stockage.');
        }

        $stream = $disk->readStream($courseFile->path);
        if (! is_resource($stream)) {
            abort(500, 'Impossible de lire le fichier.');
        }

        $filename = str_replace(["\r", "\n", '"'], '', $courseFile->original_name);

        return response()->streamDownload(function () use ($stream) {
            fpassthru($stream);
            if (is_resource($stream)) {
                fclose($stream);
            }
        }, $filename, [
            'Content-Type' => $courseFile->mime_type,
        ]);
    }

    private function scopeForTeacher(Builder $q, User $user): Builder
    {
        if (! $user->formateur?->id) {
            return $q->whereRaw('1 = 0');
        }

        return $q->whereHas('module', function (Builder $m) use ($user) {
            $this->applyTrainerModuleScope($m, (int) $user->id, (int) ($user->formateur?->id ?? 0));
        });
    }

    private function scopeForStudent(Builder $q, User $user): Builder
    {
        $stagiaire = $user->stagiaire;
        if (! $stagiaire) {
            return $q->whereRaw('1 = 0');
        }

        return $this->applyStagiaireGroupScope($q, $this->groupIdsForStagiaire($stagiaire));
    }

    private function scopeForParent(Builder $q, User $user): Builder
    {
        $parent = $user->parent;
        if (! $parent) {
            return $q->whereRaw('1 = 0');
        }

        $scopes = [];
        foreach ($parent->children as $child) {
            $ids = $this->groupIdsForStagiaire($child);
            if ($ids !== []) {
                $scopes[] = $ids;
            }
        }

        if ($scopes === []) {
            return $q->whereRaw('1 = 0');
        }

        return $q->where(function (Builder $outer) use ($scopes) {
            foreach ($scopes as $groupIds) {
                $outer->orWhere(function (Builder $sub) use ($groupIds) {
                    $this->applyStagiaireGroupScope($sub, $groupIds);
                });
            }
        });
    }

    /**
     * @return list<int>
     */
    private function groupIdsForStagiaire(Stagiaire $stagiaire): array
    {
        return collect([$stagiaire->groupe_id])
            ->merge(DB::table('groupe_stagiaire')->where('stagiaire_id', $stagiaire->id)->pluck('groupe_id'))
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();
    }

    /**
     * @param  list<int>  $groupIds
     */
    private function applyStagiaireGroupScope(Builder $q, array $groupIds): Builder
    {
        if ($groupIds === []) {
            return $q->whereRaw('1 = 0');
        }

        return $q->where(function (Builder $outer) use ($groupIds) {
            $outer->where(function (Builder $w) use ($groupIds) {
                $w->whereNotNull('course_files.groupe_id')
                    ->whereIn('course_files.groupe_id', $groupIds)
                    ->where(function (Builder $inner) {
                        $inner->whereNull('course_files.module_id')
                            ->orWhereExists(function ($s) {
                                $s->selectRaw('1')
                                    ->from('module_groupe')
                                    ->whereColumn('module_groupe.groupe_id', 'course_files.groupe_id')
                                    ->whereColumn('module_groupe.module_id', 'course_files.module_id');
                            });
                    });
            })->orWhere(function (Builder $w) use ($groupIds) {
                $w->whereNull('course_files.groupe_id')
                    ->whereNotNull('course_files.module_id')
                    ->whereExists(function ($s) use ($groupIds) {
                        $s->selectRaw('1')
                            ->from('module_groupe')
                            ->whereColumn('module_groupe.module_id', 'course_files.module_id')
                            ->whereIn('module_groupe.groupe_id', $groupIds);
                    });
            });
        });
    }

    private function teacherCanAccessFile(User $user, CourseFile $file): bool
    {
        if (! $user->formateur?->id) {
            return false;
        }

        return CourseFile::query()
            ->whereKey($file->id)
            ->whereHas('module', function (Builder $m) use ($user) {
                $this->applyTrainerModuleScope($m, (int) $user->id, (int) ($user->formateur?->id ?? 0));
            })
            ->exists();
    }

    private function applyTrainerModuleScope(Builder $moduleQuery, int $userId, int $formateurId): void
    {
        $moduleQuery
            ->whereHas('trainers', fn (Builder $t) => $t->where('users.id', $userId))
            ->orWhereExists(function ($sq) use ($formateurId) {
                $sq->selectRaw('1')
                    ->from('teacher_module')
                    ->whereColumn('teacher_module.module_id', 'modules.id')
                    ->where('teacher_module.teacher_id', $formateurId);
            });
    }

    private function studentCanAccessFile(User $user, CourseFile $file): bool
    {
        $stagiaire = $user->stagiaire;
        if (! $stagiaire) {
            return false;
        }

        return $this->stagiaireCanAccessFile($stagiaire, $file);
    }

    private function stagiaireCanAccessFile(Stagiaire $stagiaire, CourseFile $file): bool
    {
        $groupIds = collect($this->groupIdsForStagiaire($stagiaire));

        if ($file->groupe_id !== null) {
            if (! $groupIds->contains((int) $file->groupe_id)) {
                return false;
            }
            if ($file->module_id === null) {
                return true;
            }

            return DB::table('module_groupe')
                ->where('groupe_id', $file->groupe_id)
                ->where('module_id', $file->module_id)
                ->exists();
        }

        if ($file->module_id !== null) {
            return DB::table('module_groupe')
                ->where('module_id', $file->module_id)
                ->whereIn('groupe_id', $groupIds->all())
                ->exists();
        }

        return false;
    }
}

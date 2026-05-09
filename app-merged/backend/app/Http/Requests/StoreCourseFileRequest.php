<?php

namespace App\Http\Requests;

use App\Models\CourseFile;
use App\Models\Module;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Gate;

class StoreCourseFileRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        if (! $user || ! Gate::forUser($user)->allows('create', CourseFile::class)) {
            return false;
        }

        if (in_array((string) $user->role, ['admin', 'directeur', 'secretariat'], true)) {
            return true;
        }

        $moduleId = (int) $this->input('module_id');
        if ($moduleId <= 0) {
            return false;
        }

        $formateurId = (int) ($user->formateur?->id ?? 0);

        return Module::query()
            ->whereKey($moduleId)
            ->where(function (Builder $query) use ($user, $formateurId) {
                $query->whereHas('trainers', fn (Builder $trainers) => $trainers->where('users.id', (int) $user->id));

                if ($formateurId > 0) {
                    $query->orWhereExists(function ($subQuery) use ($formateurId) {
                        $subQuery->selectRaw('1')
                            ->from('teacher_module')
                            ->whereColumn('teacher_module.module_id', 'modules.id')
                            ->where('teacher_module.teacher_id', $formateurId);
                    });
                }
            })
            ->exists();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $maxKb = (int) config('course_files.max_size_kb', 51_200);

        return [
            'file' => [
                'required',
                'file',
                'max:'.$maxKb,
                'mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,txt,rtf,mp4,webm,mov,avi,mkv,mp3,mpeg,wav',
            ],
            'filiere_id' => ['required', 'integer', 'exists:filieres,id'],
            'module_id' => ['required', 'integer', 'exists:modules,id'],
            'title' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
        ];
    }
}

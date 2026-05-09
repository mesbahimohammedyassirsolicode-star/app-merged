<?php

namespace App\Http\Requests;

use App\Models\Module;
use Illuminate\Database\Eloquent\Builder;

class StoreTrainerGradesRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        if (! $user) {
            return false;
        }

        $moduleIds = collect($this->input('entries', []))
            ->pluck('module_id')
            ->push($this->input('module_id'))
            ->filter()
            ->map(fn ($moduleId) => (int) $moduleId)
            ->unique()
            ->values();

        if ($moduleIds->isEmpty()) {
            return false;
        }

        if (in_array((string) $user->role, ['admin', 'directeur', 'secretariat'], true)) {
            return true;
        }

        $formateurId = (int) ($user->formateur?->id ?? 0);

        $ownedModulesCount = Module::query()
            ->whereIn('id', $moduleIds->all())
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
            ->count();

        return $ownedModulesCount === $moduleIds->count();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'module_id' => ['required_without:entries', 'integer', 'exists:modules,id'],
            'student_id' => ['required_without:entries', 'integer', 'exists:stagiaires,id'],
            'grade' => ['required_without:entries', 'numeric', 'min:0', 'max:20'],

            'entries' => ['required_without:module_id', 'array', 'min:1'],
            'entries.*.module_id' => ['required', 'integer', 'exists:modules,id'],
            'entries.*.student_id' => ['required', 'integer', 'exists:stagiaires,id'],
            'entries.*.grade' => ['required', 'numeric', 'min:0', 'max:20'],
        ];
    }
}

<?php

namespace App\Http\Requests;

use App\Models\Module;
use Illuminate\Database\Eloquent\Builder;

class StoreGradeRequest extends ApiFormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        if (! $user) {
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
        return [
            'module_id' => ['required', 'integer', 'exists:modules,id'],
            'groupe_id' => ['required', 'integer', 'exists:groupes,id'],
            'stagiaire_id' => ['required', 'integer', 'exists:stagiaires,id'],
            'valeur' => ['required', 'numeric', 'min:0', 'max:20'],
            'item_label' => ['nullable', 'string', 'max:100'],
            'type' => ['nullable', 'in:cc,efm,projet,stage'],
            'date' => ['nullable', 'date'],
        ];
    }
}

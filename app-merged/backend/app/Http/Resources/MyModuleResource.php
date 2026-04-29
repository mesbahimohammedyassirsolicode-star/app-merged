<?php

namespace App\Http\Resources;

use App\Models\Module;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Module */
class MyModuleResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $p = $this->relationLoaded('formateurProgress') ? $this->getRelation('formateurProgress') : null;

        return [
            'id' => $this->id,
            'code' => $this->code,
            'label' => $this->label,
            'semester' => $this->semester,
            'masse_horaire' => $this->masse_horaire,
            'coefficient' => $this->coefficient,
            'filiere' => $this->whenLoaded('filiere', fn () => $this->filiere ? [
                'id' => $this->filiere->id,
                'code' => $this->filiere->code,
                'label' => $this->filiere->label ?? $this->filiere->name,
            ] : null),
            'progress' => [
                'progression' => $p?->progression ?? 0,
                'last_session' => $p?->last_session?->toIso8601String(),
            ],
        ];
    }
}

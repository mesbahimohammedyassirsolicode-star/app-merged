<?php

namespace App\Http\Resources;

use App\Models\Module;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Module */
class StagiaireModuleResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $niveauLabel = null;
        if ($this->relationLoaded('niveau') && $this->niveau !== null) {
            $niveauLabel = $this->niveau->label ?? $this->niveau->name ?? null;
        }

        $descriptionParts = array_values(array_filter([
            $niveauLabel ? 'Niveau : '.$niveauLabel : null,
            $this->semester ? 'Semestre '.$this->semester : null,
            $this->masse_horaire ? $this->masse_horaire.' h' : null,
        ]));

        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->label ?? $this->name,
            'description' => count($descriptionParts) > 0 ? implode(' · ', $descriptionParts) : null,
            'coefficient' => $this->coefficient,
            'semester' => $this->semester,
            'masse_horaire' => $this->masse_horaire,
        ];
    }
}

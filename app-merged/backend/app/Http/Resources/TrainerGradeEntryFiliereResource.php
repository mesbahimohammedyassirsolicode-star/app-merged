<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TrainerGradeEntryFiliereResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'filiere_id' => (int) $this->id,
            'filiere_name' => (string) ($this->label ?? $this->name ?? ''),
            'groups' => TrainerGradeEntryGroupResource::collection($this->whenLoaded('groups')),
        ];
    }
}

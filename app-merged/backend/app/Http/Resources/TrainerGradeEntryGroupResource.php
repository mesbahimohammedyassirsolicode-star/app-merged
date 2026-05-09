<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TrainerGradeEntryGroupResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'group_id' => (int) $this->id,
            'group_name' => (string) ($this->label ?? $this->name ?? ''),
            'modules' => TrainerGradeEntryModuleResource::collection($this->whenLoaded('modules')),
        ];
    }
}

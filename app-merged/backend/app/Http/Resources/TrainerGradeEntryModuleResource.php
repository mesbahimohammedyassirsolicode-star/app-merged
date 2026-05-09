<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TrainerGradeEntryModuleResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'module_id' => (int) $this->id,
            'module_name' => (string) ($this->label ?? $this->name ?? ''),
            'students' => TrainerGradeEntryStudentResource::collection($this->whenLoaded('students')),
        ];
    }
}

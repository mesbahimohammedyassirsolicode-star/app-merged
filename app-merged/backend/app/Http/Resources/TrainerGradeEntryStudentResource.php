<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TrainerGradeEntryStudentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => (int) $this->id,
            'name' => (string) ($this->user?->name ?? ''),
            'existing_grade' => $this->existing_grade !== null ? (float) $this->existing_grade : null,
        ];
    }
}

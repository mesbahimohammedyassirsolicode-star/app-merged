<?php

namespace App\Http\Resources;

use App\Models\CourseFile;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin CourseFile */
class CourseFileResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'original_name' => $this->original_name,
            'mime_type' => $this->mime_type,
            'size_bytes' => $this->size_bytes,
            'groupe_id' => $this->groupe_id,
            'module_id' => $this->module_id,
            'groupe' => $this->whenLoaded('groupe', fn () => [
                'id' => $this->groupe->id,
                'label' => $this->groupe->label,
                'filiere' => $this->groupe->relationLoaded('filiere') && $this->groupe->filiere ? [
                    'id' => $this->groupe->filiere->id,
                    'name' => $this->groupe->filiere->name,
                    'label' => $this->groupe->filiere->label,
                ] : null,
            ]),
            'module' => $this->whenLoaded('module', fn () => [
                'id' => $this->module->id,
                'code' => $this->module->code,
                'label' => $this->module->label,
                'filiere' => $this->module->relationLoaded('filiere') && $this->module->filiere ? [
                    'id' => $this->module->filiere->id,
                    'name' => $this->module->filiere->name,
                    'label' => $this->module->filiere->label,
                ] : null,
            ]),
            'uploader' => $this->whenLoaded('uploader', fn () => [
                'id' => $this->uploader->id,
                'name' => $this->uploader->name,
            ]),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}

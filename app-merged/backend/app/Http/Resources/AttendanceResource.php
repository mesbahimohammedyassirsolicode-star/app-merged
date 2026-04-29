<?php

namespace App\Http\Resources;

use App\Models\Attendance;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Attendance
 */
class AttendanceResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $status = (string) $this->status;
        if ($status === 'retard') {
            $status = 'late';
        }

        return [
            'id' => $this->id,
            'seance_id' => $this->seance_id,
            'stagiaire_id' => $this->stagiaire_id,
            'student_id' => $this->student_id,
            'module_id' => $this->module_id,
            'group_id' => $this->group_id,
            'filiere_id' => $this->filiere_id,
            'teacher_id' => $this->teacher_id,
            'formateur_id' => $this->formateur_id,
            'date' => $this->date?->format('Y-m-d'),
            'academic_year' => $this->academic_year,
            'status' => $status,
            'minutes_late' => $this->minutes_late,
            'note' => $this->note,
            'student' => $this->whenLoaded('student', fn () => [
                'id' => $this->student?->id,
                'name' => $this->student?->name,
                'email' => $this->student?->email,
            ]),
            'stagiaire' => $this->whenLoaded('stagiaire', fn () => [
                'id' => $this->stagiaire?->id,
                'cef_number' => $this->stagiaire?->cef_number,
            ]),
            'module' => $this->whenLoaded('module', fn () => [
                'id' => $this->module?->id,
                'code' => $this->module?->code,
                'label' => $this->module?->label ?? $this->module?->name,
            ]),
            'group' => $this->whenLoaded('group', fn () => [
                'id' => $this->group?->id,
                'label' => $this->group?->label ?? $this->group?->name,
            ]),
            'filiere' => $this->whenLoaded('filiere', fn () => [
                'id' => $this->filiere?->id,
                'code' => $this->filiere?->code,
                'label' => $this->filiere?->label ?? $this->filiere?->name,
            ]),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}

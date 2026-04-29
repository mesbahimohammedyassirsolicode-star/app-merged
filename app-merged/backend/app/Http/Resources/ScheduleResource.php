<?php

namespace App\Http\Resources;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ScheduleResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $module = $this->module ?? $this->affectation?->module;
        $groupe = $this->groupe;
        $teacherName = $this->user?->name ?? $this->affectation?->formateur?->user?->name;
        $dateString = is_object($this->date) ? $this->date->format('Y-m-d') : (string) $this->date;
        $subject = $module?->label ?? $module?->code ?? 'Séance';
        $day = Carbon::parse($dateString)->format('l');

        return [
            'id' => $this->id,
            'scope' => $this->groupe_id ? 'group' : 'global',
            'date' => $dateString,
            'day' => $day,
            'start_time' => (string) $this->start_time,
            'end_time' => (string) $this->end_time,
            'subject' => $subject,
            'salle' => $this->salle,
            'status' => (string) $this->status,
            'type' => (string) $this->type,
            'user_id' => $this->user_id,
            'module_id' => $this->module_id,
            'groupe_id' => $this->groupe_id,
            'filiere_id' => $this->filiere_id,
            'module' => $module ? [
                'id' => $module->id,
                'code' => $module->code,
                'label' => $module->label,
            ] : null,
            'groupe' => $groupe ? [
                'id' => $groupe->id,
                'label' => $groupe->label,
            ] : null,
            'teacher' => $teacherName ? ['name' => $teacherName] : null,
        ];
    }
}

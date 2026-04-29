<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MarkAttendanceSessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'group_id' => ['required', 'integer', 'exists:groupes,id'],
            'module_id' => ['required', 'integer', 'exists:modules,id'],
            'teacher_id' => ['nullable', 'integer', 'exists:users,id'],
            'date' => ['required', 'date'],
            'academic_year' => ['required', 'string', 'max:9'],
            'attendances' => ['required', 'array', 'min:1'],
            'attendances.*.student_id' => ['required', 'integer', 'exists:users,id'],
            'attendances.*.status' => ['required', 'in:present,absent,late'],
            'attendances.*.minutes_late' => ['nullable', 'integer', 'min:1'],
            'attendances.*.note' => ['nullable', 'string'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $rows = $this->input('attendances', []);
            if (! is_array($rows)) {
                return;
            }

            $ids = [];
            foreach ($rows as $row) {
                if (is_array($row) && isset($row['student_id'])) {
                    $ids[] = (int) $row['student_id'];
                }
            }
            if (count($ids) !== count(array_unique($ids))) {
                $validator->errors()->add('attendances', 'Each student may only appear once in this session.');
            }

            foreach ($rows as $i => $row) {
                if (! is_array($row)) {
                    continue;
                }
                if (($row['status'] ?? null) !== 'late') {
                    continue;
                }
                $minutes = $row['minutes_late'] ?? null;
                if ($minutes === null || (int) $minutes < 1) {
                    $validator->errors()->add(
                        'attendances.'.$i.'.minutes_late',
                        'Minutes de retard requises (> 0) lorsque le statut est retard.'
                    );
                }
            }
        });
    }
}

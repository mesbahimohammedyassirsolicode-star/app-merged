<?php

namespace App\Http\Requests;

use App\Services\AttendanceService;
use Illuminate\Foundation\Http\FormRequest;

class DetectAttendanceSessionRequest extends FormRequest
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
            'date' => ['required', 'date'],
            'academic_year' => ['nullable', 'string', 'max:9'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->filled('academic_year') || ! $this->filled('date')) {
            return;
        }

        /** @var AttendanceService $svc */
        $svc = app(AttendanceService::class);
        $this->merge([
            'academic_year' => $svc->resolveAcademicYearFromDate((string) $this->input('date')),
        ]);
    }
}

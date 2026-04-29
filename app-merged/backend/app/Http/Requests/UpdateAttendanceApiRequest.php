<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAttendanceApiRequest extends FormRequest
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
            'status' => ['required', 'in:present,absent,late'],
            'minutes_late' => ['nullable', 'integer', 'min:1', 'required_if:status,late'],
            'note' => ['nullable', 'string'],
        ];
    }
}

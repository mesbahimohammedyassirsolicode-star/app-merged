<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCourseFileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $maxKb = (int) config('course_files.max_size_kb', 51_200);

        return [
            'file' => [
                'required',
                'file',
                'max:'.$maxKb,
                'mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,txt,rtf,mp4,webm,mov,avi,mkv,mp3,mpeg,wav',
            ],
            'filiere_id' => ['required', 'integer', 'exists:filieres,id'],
            'module_id' => ['required', 'integer', 'exists:modules,id'],
            'title' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
        ];
    }
}

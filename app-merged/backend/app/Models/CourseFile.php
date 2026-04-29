<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class CourseFile extends Model
{
    use SoftDeletes;

    protected $table = 'course_files';

    protected $fillable = [
        'uploaded_by_user_id',
        'groupe_id',
        'module_id',
        'title',
        'description',
        'original_name',
        'disk',
        'path',
        'mime_type',
        'size_bytes',
    ];

    protected function casts(): array
    {
        return [
            'size_bytes' => 'integer',
        ];
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by_user_id');
    }

    public function groupe(): BelongsTo
    {
        return $this->belongsTo(Groupe::class, 'groupe_id');
    }

    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class, 'module_id');
    }
}

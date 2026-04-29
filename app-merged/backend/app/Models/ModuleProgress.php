<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ModuleProgress extends Model
{
    protected $table = 'module_progress';

    protected $fillable = [
        'formateur_id',
        'module_id',
        'progression',
        'last_session',
    ];

    protected function casts(): array
    {
        return [
            'last_session' => 'datetime',
        ];
    }

    public function formateur(): BelongsTo
    {
        return $this->belongsTo(Formateur::class);
    }

    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attendance extends Model
{
    protected $fillable = [
        'seance_id',
        'stagiaire_id',
        'student_id',
        'module_id',
        'group_id',
        'filiere_id',
        'teacher_id',
        'formateur_id',
        'date',
        'academic_year',
        'created_by',
        'status',
        'minutes_late',
        'retard_minutes',
        'note',
        'justifie',
        'motif',
        'justification_doc',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'justifie' => 'boolean',
        ];
    }

    public function seance(): BelongsTo
    {
        return $this->belongsTo(Seance::class);
    }

    public function stagiaire(): BelongsTo
    {
        return $this->belongsTo(Stagiaire::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class);
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(Groupe::class, 'group_id');
    }

    public function filiere(): BelongsTo
    {
        return $this->belongsTo(Filiere::class);
    }

    public function formateur(): BelongsTo
    {
        return $this->belongsTo(Formateur::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}

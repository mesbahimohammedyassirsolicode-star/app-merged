<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Module extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'modules';

    protected $fillable = [
        'niveau_id',
        'filiere_id',
        'code',
        'label',
        'name',
        'coefficient',
        'masse_horaire',
        'semester',
    ];

    public function niveau(): BelongsTo
    {
        return $this->belongsTo(Niveau::class);
    }

    public function filiere(): BelongsTo
    {
        return $this->belongsTo(Filiere::class);
    }

    public function groupes(): BelongsToMany
    {
        return $this->belongsToMany(Groupe::class, 'module_groupe', 'module_id', 'groupe_id')
            ->withPivot(['academic_year', 'semester', 'planned_hours'])
            ->withTimestamps();
    }

    public function syllabusItems(): HasMany
    {
        return $this->hasMany(SyllabusItem::class);
    }

    public function courseFiles(): HasMany
    {
        return $this->hasMany(CourseFile::class, 'module_id');
    }

    public function progressRecords(): HasMany
    {
        return $this->hasMany(ModuleProgress::class, 'module_id');
    }

    public function getLabelAttribute($value): ?string
    {
        return $value ?? $this->attributes['name'] ?? null;
    }

    public function getNameAttribute($value): ?string
    {
        return $value ?? $this->attributes['label'] ?? null;
    }

    public function setLabelAttribute($value): void
    {
        $this->attributes['label'] = $value;
        if (! array_key_exists('name', $this->attributes) || $this->attributes['name'] === null) {
            $this->attributes['name'] = $value;
        }
    }

    public function setNameAttribute($value): void
    {
        $this->attributes['name'] = $value;
        if (! array_key_exists('label', $this->attributes) || $this->attributes['label'] === null) {
            $this->attributes['label'] = $value;
        }
    }
}

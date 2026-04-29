<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Groupe extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'groupes';

    protected $fillable = [
        'niveau_id',
        'filiere_id',
        'annee_scolaire_id',
        'label',
        'name',
        'year_level',
        'capacity',
    ];

    public function anneeScolaire(): BelongsTo
    {
        return $this->belongsTo(AnneeScolaire::class);
    }

    public function niveau(): BelongsTo
    {
        return $this->belongsTo(Niveau::class);
    }

    public function filiere(): BelongsTo
    {
        return $this->belongsTo(Filiere::class);
    }

    public function stagiaires(): HasMany
    {
        return $this->hasMany(Stagiaire::class, 'groupe_id');
    }

    public function modules(): BelongsToMany
    {
        return $this->belongsToMany(Module::class, 'module_groupe', 'groupe_id', 'module_id')
            ->withPivot(['academic_year', 'semester', 'planned_hours'])
            ->withTimestamps();
    }

    public function students(): HasMany
    {
        return $this->hasMany(Stagiaire::class, 'groupe_id');
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class, 'group_id');
    }

    public function courseFiles(): HasMany
    {
        return $this->hasMany(CourseFile::class, 'groupe_id');
    }

    /** Scheduled sessions for this groupe (emploi du temps DB-backed). */
    public function seances(): HasMany
    {
        return $this->hasMany(Seance::class, 'groupe_id');
    }

    /** Alias for emploi du temps domain language. */
    public function emploiDuTemps(): HasMany
    {
        return $this->seances();
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

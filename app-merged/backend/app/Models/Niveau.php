<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Niveau extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'niveaux';

    protected $fillable = [
        'filiere_id',
        'code',
        'label',
        'name',
    ];

    public function filiere(): BelongsTo
    {
        return $this->belongsTo(Filiere::class);
    }

    public function groupes(): HasMany
    {
        return $this->hasMany(Groupe::class, 'niveau_id');
    }

    public function modules(): HasMany
    {
        return $this->hasMany(Module::class, 'niveau_id');
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

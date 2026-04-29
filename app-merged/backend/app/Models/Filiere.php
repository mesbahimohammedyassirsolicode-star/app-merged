<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Filiere extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'code',
        'name',
        'label',
        'type',
        'required_level',
        'duration_years',
        'description',
        'niveau_id',
    ];

    public function niveau(): BelongsTo
    {
        return $this->belongsTo(Niveau::class);
    }

    public function niveaux(): HasMany
    {
        return $this->hasMany(Niveau::class);
    }

    public function modules(): HasMany
    {
        return $this->hasMany(Module::class);
    }

    public function groupes(): HasMany
    {
        return $this->hasMany(Groupe::class, 'filiere_id');
    }

    public function groups(): HasMany
    {
        return $this->groupes();
    }

    public function seances(): HasMany
    {
        return $this->hasMany(Seance::class, 'filiere_id');
    }

    public function ensureMinimumGroups(int $minimum = 2): void
    {
        $existingCount = $this->groupes()->count();
        $missingCount = max(0, $minimum - $existingCount);

        if ($missingCount === 0) {
            return;
        }

        $baseName = $this->code ?: 'FILIERE-'.$this->getKey();

        for ($index = $existingCount + 1; $index <= $existingCount + $missingCount; $index++) {
            $groupName = sprintf('%s-G%d', $baseName, $index);

            $this->groupes()->create([
                'name' => $groupName,
                'label' => 'Group '.$index,
            ]);
        }
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

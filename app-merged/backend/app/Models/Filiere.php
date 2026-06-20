<?php

namespace App\Models;

use App\Models\AnneeScolaire;
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
        $targetGroups = collect([
            1 => '1ère année',
            2 => '2ème année',
        ])->take(max(0, $minimum));

        if ($targetGroups->isEmpty()) {
            return;
        }

        $academicYearId = AnneeScolaire::query()->where('is_current', true)->value('id')
            ?? AnneeScolaire::query()->orderByDesc('year_start')->value('id');

        foreach ($targetGroups as $yearLevel => $label) {
            $exists = $this->groupes()
                ->where('year_level', $yearLevel)
                ->orWhere('label', $label)
                ->exists();

            if ($exists) {
                continue;
            }

            $this->groupes()->create([
                'niveau_id' => $this->niveau_id,
                'annee_scolaire_id' => $academicYearId,
                'name' => $label,
                'label' => $label,
                'year_level' => $yearLevel,
                'capacity' => 30,
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

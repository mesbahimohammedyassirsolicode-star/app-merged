<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Evaluation extends Model
{
    use HasFactory, SoftDeletes;

    protected $guarded = ['id'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function module()
    {
        return $this->belongsTo(Module::class);
    }

    public function groupe()
    {
        return $this->belongsTo(Groupe::class);
    }

    public function notes()
    {
        return $this->hasMany(Note::class);
    }

    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        if (in_array((string) $user->role, ['admin', 'directeur', 'secretariat'], true)) {
            return $query;
        }

        if (in_array((string) $user->role, ['teacher', 'formateur'], true)) {
            return $query->where('user_id', $user->id);
        }

        if (in_array((string) $user->role, ['student', 'stagiaire'], true)) {
            $stagiaireId = (int) ($user->stagiaire?->id ?? 0);

            return $stagiaireId > 0
                ? $query->whereHas('notes', fn (Builder $notes) => $notes->where('stagiaire_id', $stagiaireId))
                : $query->whereRaw('0 = 1');
        }

        if ($user->role === 'parent') {
            $childIds = $user->parent?->children()
                ->pluck('stagiaires.id')
                ->map(fn ($id) => (int) $id)
                ->all() ?? [];

            return ! empty($childIds)
                ? $query->whereHas('notes', fn (Builder $notes) => $notes->whereIn('stagiaire_id', $childIds))
                : $query->whereRaw('0 = 1');
        }

        return $query->whereRaw('0 = 1');
    }
}

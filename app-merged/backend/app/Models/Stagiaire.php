<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Collection;

class Stagiaire extends Model
{
    use HasFactory, SoftDeletes;

    protected $guarded = ['id'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function filiere()
    {
        return $this->belongsTo(Filiere::class);
    }

    public function groupe()
    {
        return $this->belongsTo(Groupe::class);
    }

    /**
     * Legacy single-FK parent (denormalized when exactly one parent is linked in pivot).
     */
    public function parent()
    {
        return $this->belongsTo(StudentParent::class, 'parent_id');
    }

    /**
     * Parents linked via parent_stagiaire (supports multiple accounts per stagiaire).
     */
    public function parents()
    {
        return $this->belongsToMany(StudentParent::class, 'parent_stagiaire', 'stagiaire_id', 'parent_id')
            ->withTimestamps();
    }

    public function groupes()
    {
        return $this->belongsToMany(Groupe::class, 'groupe_stagiaire')
            ->withTimestamps();
    }

    public function absences()
    {
        return $this->hasMany(Absence::class);
    }

    // FIXED: Old attendances() used wrong FK (stagiaire_id). Split into two named relations.
    // Legacy seance-based attendances share the Absence model — no change needed there.

    /**
     * Modern attendance records (new system).
     * student_id on attendances table = users.id (not stagiaire.id).
     */
    public function attendanceRecords()
    {
        return $this->hasMany(Attendance::class, 'student_id', 'user_id'); // FIXED: correct FK
    }

    public function notes()
    {
        return $this->hasMany(Note::class);
    }

    /**
     * @deprecated Use attendanceRecords() for the modern attendance system.
     * This relation uses stagiaire_id FK which only applies to the legacy seance/absences system.
     * Kept for backward compatibility — do NOT use for Attendance model queries.
     */
    public function attendances()
    {
        return $this->hasMany(Attendance::class, 'stagiaire_id'); // FIXED: explicit FK so intent is clear
    }

    public function stages()
    {
        return $this->hasMany(Stage::class);
    }

    /**
     * Canonical filière ID for data isolation: stagiaire's filiere_id or from their groupe.
     * Use when scoping modules/groups/affectations so students only see their filière.
     */
    public function getFiliereIdForScope(): ?int
    {
        if ($this->filiere_id) {
            return (int) $this->filiere_id;
        }
        $groupe = $this->relationLoaded('groupe')
            ? $this->groupe
            : ($this->groupe_id ? $this->groupe()->with('niveau')->first() : $this->groupes()->with('niveau')->first());

        if ($groupe !== null) {
            if ($groupe->filiere_id) {
                return (int) $groupe->filiere_id;
            }
            if ($groupe->niveau !== null && $groupe->niveau->filiere_id !== null) {
                return (int) $groupe->niveau->filiere_id;
            }
        }

        return null;
    }

    /**
     * Groupe IDs for this stagiaire that belong to the given filière (for strict isolation).
     */
    public function getGroupeIdsInFiliere(int $filiereId): Collection
    {
        $ids = $this->groupes()
            ->where(function ($q) use ($filiereId) {
                $q->where('groupes.filiere_id', $filiereId)
                    ->orWhereHas('niveau', fn ($n) => $n->where('filiere_id', $filiereId));
            })
            ->pluck('groupes.id');
        $groupe = $this->relationLoaded('groupe') ? $this->groupe : ($this->groupe_id ? $this->groupe()->with('niveau')->first() : null);
        if ($ids->isEmpty() && $this->groupe_id && $groupe !== null) {
            $groupeFiliereId = $groupe->filiere_id ?? $groupe->niveau?->filiere_id ?? null;
            if ($groupeFiliereId !== null && (int) $groupeFiliereId === $filiereId) {
                return collect([$this->groupe_id]);
            }
        }

        return $ids;
    }
}

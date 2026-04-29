<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Formateur extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'matricule',
        'specialty',
        'type',
        'hourly_rate',
        'filiere_id',
        'niveau',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function modules()
    {
        return $this->belongsToMany(Module::class, 'teacher_module', 'teacher_id', 'module_id')
            ->withPivot(['academic_year', 'semester', 'weekly_hours'])
            ->withTimestamps();
    }

    public function groups()
    {
        return $this->belongsToMany(Groupe::class, 'formateur_group', 'user_id', 'groupe_id')
            ->withTimestamps();
    }

    public function modulesWithGroupesAndFilieres()
    {
        return $this->modules()->with(['groupes.niveau.filiere']);
    }

    public function moduleProgressEntries(): HasMany
    {
        return $this->hasMany(ModuleProgress::class);
    }
}

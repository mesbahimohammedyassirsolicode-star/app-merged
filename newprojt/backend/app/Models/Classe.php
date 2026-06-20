<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Classe extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'niveau_id', 'enseignant_principal_id', 'capacite_max', 'school_id'];

    public function niveau()
    {
        return $this->belongsTo(Niveau::class);
    }

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function enseignantPrincipal()
    {
        return $this->belongsTo(Enseignant::class, 'enseignant_principal_id');
    }

    public function eleves()
    {
        return $this->hasMany(Eleve::class);
    }

    public function enseignants()
    {
        return $this->belongsToMany(Enseignant::class, 'enseignant_classe');
    }

    public function emploiDuTemps()
    {
        return $this->hasMany(EmploiDuTemps::class);
    }
}

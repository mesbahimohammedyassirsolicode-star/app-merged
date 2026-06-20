<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Enseignant extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'nom', 'prenom', 'cin', 'matiere', 
        'telephone', 'email', 'date_recrutement', 'school_id'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function classesPrincipales()
    {
        return $this->hasMany(Classe::class, 'enseignant_principal_id');
    }

    public function classes()
    {
        return $this->belongsToMany(Classe::class, 'enseignant_classe');
    }

    public function notes()
    {
        return $this->hasMany(Note::class);
    }

    public function emploiDuTemps()
    {
        return $this->hasMany(EmploiDuTemps::class);
    }
}

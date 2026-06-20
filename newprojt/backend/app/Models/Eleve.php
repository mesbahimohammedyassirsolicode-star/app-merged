<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Eleve extends Model
{
    use HasFactory;

    protected $fillable = [
        'nom', 'prenom', 'code_massar', 'date_naissance', 
        'adresse', 'photo', 'classe_id', 'school_id', 'statut'
    ];

    public function classe()
    {
        return $this->belongsTo(Classe::class);
    }

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function parents()
    {
        return $this->belongsToMany(ParentModel::class, 'eleve_parent', 'eleve_id', 'parent_id')
                    ->withPivot('relation')
                    ->withTimestamps();
    }

    public function notes()
    {
        return $this->hasMany(Note::class);
    }

    public function absences()
    {
        return $this->hasMany(Absence::class);
    }

    public function paiements()
    {
        return $this->hasMany(Paiement::class);
    }

    public function bus()
    {
        return $this->belongsToMany(Bus::class, 'eleve_bus')
                    ->withPivot('arret_matin', 'arret_soir')
                    ->withTimestamps();
    }
}

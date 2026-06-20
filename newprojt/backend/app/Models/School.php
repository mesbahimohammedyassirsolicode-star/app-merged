<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class School extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'address', 'phone', 'email', 'logo'];

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function niveaux()
    {
        return $this->hasMany(Niveau::class);
    }

    public function classes()
    {
        return $this->hasMany(Classe::class);
    }

    public function eleves()
    {
        return $this->hasMany(Eleve::class);
    }

    public function enseignants()
    {
        return $this->hasMany(Enseignant::class);
    }

    public function bus()
    {
        return $this->hasMany(Bus::class);
    }
}

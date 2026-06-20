<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Matiere extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'coefficient', 'niveau_id'];

    public function niveau()
    {
        return $this->belongsTo(Niveau::class);
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

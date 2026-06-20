<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Bus extends Model
{
    use HasFactory;

    protected $table = 'bus';

    protected $fillable = [
        'numero', 'marque', 'capacite', 'chauffeur_id', 
        'zone', 'plaque', 'school_id'
    ];

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function chauffeur()
    {
        return $this->belongsTo(User::class, 'chauffeur_id');
    }

    public function eleves()
    {
        return $this->belongsToMany(Eleve::class, 'eleve_bus')
                    ->withPivot('arret_matin', 'arret_soir')
                    ->withTimestamps();
    }

    public function incidents()
    {
        return $this->hasMany(IncidentTransport::class);
    }
}

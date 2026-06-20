<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Paiement extends Model
{
    use HasFactory;

    protected $fillable = [
        'eleve_id', 'mois', 'montant', 'mode_paiement', 
        'date_paiement', 'statut', 'note', 'school_id'
    ];

    public function eleve()
    {
        return $this->belongsTo(Eleve::class);
    }

    public function school()
    {
        return $this->belongsTo(School::class);
    }
}

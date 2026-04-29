<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Affectation extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'formateur_id',
        'module_id',
        'groupe_id',
        'annee_scolaire_id',
    ];

    public function formateur()
    {
        return $this->belongsTo(Formateur::class);
    }

    public function module()
    {
        return $this->belongsTo(Module::class);
    }

    public function groupe()
    {
        return $this->belongsTo(Groupe::class);
    }

    public function anneeScolaire()
    {
        return $this->belongsTo(AnneeScolaire::class);
    }
}

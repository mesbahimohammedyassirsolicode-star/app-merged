<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Stage extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'stagiaire_id', 'groupe_id', 'formateur_id',
        'organisation', 'poste', 'date_debut', 'date_fin',
        'status', 'rapport_path', 'note', 'observation',
    ];

    public function stagiaire(): BelongsTo
    {
        return $this->belongsTo(Stagiaire::class);
    }

    public function groupe(): BelongsTo
    {
        return $this->belongsTo(Groupe::class);
    }

    public function formateur(): BelongsTo
    {
        return $this->belongsTo(Formateur::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Absence extends Model
{
    use HasFactory, SoftDeletes;

    protected $guarded = ['id'];

    public function stagiaire()
    {
        return $this->belongsTo(Stagiaire::class);
    }

    public function seance()
    {
        return $this->belongsTo(Seance::class);
    }
}

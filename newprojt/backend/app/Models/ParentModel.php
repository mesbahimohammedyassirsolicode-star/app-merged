<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ParentModel extends Model
{
    use HasFactory;

    protected $table = 'parents';

    protected $fillable = ['user_id', 'nom', 'prenom', 'cin', 'telephone', 'email', 'adresse'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function eleves()
    {
        return $this->belongsToMany(Eleve::class, 'eleve_parent', 'parent_id', 'eleve_id')
                    ->withPivot('relation')
                    ->withTimestamps();
    }
}

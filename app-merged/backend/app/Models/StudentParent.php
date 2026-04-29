<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class StudentParent extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'parents';

    protected $guarded = ['id'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Linked stagiaires (pivot parent_stagiaire). Use this as the canonical link.
     */
    public function stagiaires()
    {
        return $this->belongsToMany(Stagiaire::class, 'parent_stagiaire', 'parent_id', 'stagiaire_id')
            ->withTimestamps();
    }

    /** @deprecated Prefer stagiaires() — kept as alias for existing callers. */
    public function children()
    {
        return $this->stagiaires();
    }
}

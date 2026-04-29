<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Note extends Model
{
    use Auditable, HasFactory, SoftDeletes;

    protected $guarded = ['id'];

    public function evaluation()
    {
        return $this->belongsTo(Evaluation::class);
    }

    public function stagiaire()
    {
        return $this->belongsTo(Stagiaire::class);
    }
}

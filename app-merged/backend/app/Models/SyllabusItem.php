<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class SyllabusItem extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'syllabus_items';

    protected $guarded = ['id'];

    public function module()
    {
        return $this->belongsTo(Module::class);
    }
}

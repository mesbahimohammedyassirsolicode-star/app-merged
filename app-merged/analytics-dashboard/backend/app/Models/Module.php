<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Module extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'credits',
        'semester_id',
    ];

    public function groups()
    {
        return $this->hasMany(Group::class);
    }

    public function analyticsRecords()
    {
        return $this->hasMany(AnalyticsRecord::class);
    }
}
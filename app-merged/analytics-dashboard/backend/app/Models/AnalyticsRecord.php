<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AnalyticsRecord extends Model
{
    use HasFactory;

    protected $table = 'analytics_records';

    protected $fillable = [
        'module_id',
        'group_id',
        'filiere_id',
        'semester_id',
        'date_start',
        'date_end',
        'notes',
        'absences',
        'success_rate',
    ];

    public function module()
    {
        return $this->belongsTo(Module::class);
    }

    public function group()
    {
        return $this->belongsTo(Group::class);
    }

    public function filiere()
    {
        return $this->belongsTo(Filiere::class);
    }

    public function semester()
    {
        return $this->belongsTo(Semester::class);
    }
}
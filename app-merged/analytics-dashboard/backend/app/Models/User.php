<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    public function modules()
    {
        return $this->hasMany(Module::class);
    }

    public function groups()
    {
        return $this->hasMany(Group::class);
    }

    public function analyticsRecords()
    {
        return $this->hasMany(AnalyticsRecord::class);
    }
}
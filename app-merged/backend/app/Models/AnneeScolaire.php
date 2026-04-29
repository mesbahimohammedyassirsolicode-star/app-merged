<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class AnneeScolaire extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'annees_scolaires';

    protected $guarded = ['id'];
}

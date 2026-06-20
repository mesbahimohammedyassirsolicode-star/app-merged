<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class IncidentTransport extends Model
{
    use HasFactory;

    protected $fillable = ['bus_id', 'date', 'type', 'description', 'statut'];

    public function bus()
    {
        return $this->belongsTo(Bus::class);
    }
}

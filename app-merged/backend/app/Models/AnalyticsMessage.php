<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AnalyticsMessage extends Model
{
    protected $fillable = [
        'conversation_id',
        'role',
        'message',
        'payload',
        'context_snapshot',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'context_snapshot' => 'array',
        ];
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(AnalyticsConversation::class, 'conversation_id');
    }
}

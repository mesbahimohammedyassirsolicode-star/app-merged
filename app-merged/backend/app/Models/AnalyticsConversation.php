<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AnalyticsConversation extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'scope_hash',
        'context_snapshot',
    ];

    protected function casts(): array
    {
        return [
            'context_snapshot' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(AnalyticsMessage::class, 'conversation_id');
    }
}

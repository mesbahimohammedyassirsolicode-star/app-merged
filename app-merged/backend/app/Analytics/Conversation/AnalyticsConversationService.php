<?php

namespace App\Analytics\Conversation;

use App\Models\AnalyticsConversation;
use App\Models\AnalyticsMessage;
use App\Models\User;

class AnalyticsConversationService
{
    public function startOrContinue(User $user, ?string $conversationId = null): AnalyticsConversation
    {
        if ($conversationId !== null) {
            $conversation = AnalyticsConversation::query()
                ->where('id', $conversationId)
                ->where('user_id', $user->id)
                ->first();

            if ($conversation) {
                return $conversation;
            }
        }

        return AnalyticsConversation::query()->create([
            'user_id' => $user->id,
            'title' => 'Analytics session '.now()->format('Y-m-d H:i'),
            'scope_hash' => '',
            'context_snapshot' => [],
        ]);
    }

    public function recentContext(AnalyticsConversation $conversation): array
    {
        $message = $conversation->messages()->latest('created_at')->first();

        return is_array($message?->context_snapshot) ? $message->context_snapshot : ($conversation->context_snapshot ?? []);
    }

    public function appendUserMessage(AnalyticsConversation $conversation, string $query, array $context = []): AnalyticsMessage
    {
        return $conversation->messages()->create([
            'role' => 'user',
            'message' => $query,
            'context_snapshot' => $context,
        ]);
    }

    public function appendAssistantMessage(AnalyticsConversation $conversation, array $payload, array $context = []): AnalyticsMessage
    {
        $message = $conversation->messages()->create([
            'role' => 'assistant',
            'message' => (string) ($payload['summary'] ?? 'Analytics response generated.'),
            'payload' => $payload,
            'context_snapshot' => $context,
        ]);

        $conversation->forceFill([
            'context_snapshot' => $context,
            'updated_at' => now(),
        ])->save();

        return $message;
    }
}

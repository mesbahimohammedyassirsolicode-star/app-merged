<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    public function __construct(
        private NotificationService $notificationService
    ) {}

    /**
     * Get inbox for the current user.
     */
    public function index(Request $request)
    {
        $userId = (int) $request->user()->id;
        $peerId = (int) $request->integer('peer_id', 0);

        if ($peerId > 0) {
            $messages = Message::query()
                ->with(['sender:id,name', 'receiver:id,name'])
                ->where(function ($q) use ($userId, $peerId) {
                    $q->where('sender_id', $userId)->where('receiver_id', $peerId);
                })
                ->orWhere(function ($q) use ($userId, $peerId) {
                    $q->where('sender_id', $peerId)->where('receiver_id', $userId);
                })
                ->orderBy('created_at')
                ->paginate(50);

            return $this->success($messages->items(), [
                'current_page' => $messages->currentPage(),
                'last_page' => $messages->lastPage(),
                'per_page' => $messages->perPage(),
                'total' => $messages->total(),
            ]);
        }

        $messages = Message::query()
            ->with(['sender:id,name', 'receiver:id,name'])
            ->where('sender_id', $userId)
            ->orWhere('receiver_id', $userId)
            ->latest('created_at')
            ->get();

        $conversations = $messages
            ->groupBy(function (Message $message) use ($userId) {
                return (int) ($message->sender_id === $userId ? $message->receiver_id : $message->sender_id);
            })
            ->map(function ($items, $peerId) use ($userId) {
                $latest = $items->sortByDesc('created_at')->first();
                $unread = $items->where('receiver_id', $userId)->whereNull('read_at')->count();
                $peer = (int) $peerId === (int) $latest->sender_id ? $latest->sender : $latest->receiver;

                return [
                    'peer' => [
                        'id' => (int) $peer->id,
                        'name' => (string) $peer->name,
                    ],
                    'last_message' => [
                        'id' => (int) $latest->id,
                        'content' => (string) $latest->content,
                        'created_at' => $latest->created_at,
                        'sender_id' => (int) $latest->sender_id,
                    ],
                    'unread_count' => $unread,
                ];
            })
            ->values();

        return $this->success($conversations);
    }

    /**
     * Send a message.
     */
    public function store(Request $request)
    {
        $request->validate([
            'receiver_id' => 'required|exists:users,id',
            'content' => 'required|string',
        ]);

        $message = Message::create([
            'sender_id' => $request->user()->id,
            'receiver_id' => $request->receiver_id,
            'content' => $request->content,
        ]);

        if ($message->receiver) {
            $this->notificationService->notify(
                $message->receiver,
                'Nouveau message',
                'Vous avez recu un nouveau message de '.$request->user()->name.'.',
                'message_received',
                null,
                [],
                ['message_id' => (int) $message->id, 'sender_id' => (int) $message->sender_id]
            );
        }

        return $this->created($message->load(['sender:id,name', 'receiver:id,name']));
    }

    /**
     * Mark message as read.
     */
    public function markAsRead(Request $request, Message $message)
    {
        if ($message->receiver_id !== $request->user()->id) {
            return $this->error('Unauthorized', 403);
        }

        $message->update(['read_at' => now()]);

        return $this->success($message);
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    /**
     * Get inbox for the current user.
     */
    public function index(Request $request)
    {
        $messages = Message::with(['sender', 'receiver'])
            ->where('receiver_id', $request->user()->id)
            ->orWhere('sender_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return $this->success(
            $messages->items(),
            [
                'current_page' => $messages->currentPage(),
                'last_page' => $messages->lastPage(),
                'per_page' => $messages->perPage(),
                'total' => $messages->total(),
            ]
        );
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

        return $this->created($message);
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

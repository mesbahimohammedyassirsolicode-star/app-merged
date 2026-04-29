<?php

namespace App\Events;

use App\Models\Note;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LowGradeDetected
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $note;

    /**
     * Create a new event instance.
     */
    public function __construct(Note $note)
    {
        $this->note = $note;
    }
}

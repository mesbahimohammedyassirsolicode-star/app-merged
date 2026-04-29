<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class LowGradeAlertMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;

    public $note;

    /**
     * Create a new message instance.
     */
    public function __construct(User $user, array $data)
    {
        $this->user = $user;
        $this->note = $data['note'];
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Alerte de note basse - GIMS',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.low_grade_alert',
        );
    }
}

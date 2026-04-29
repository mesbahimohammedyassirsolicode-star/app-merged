<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AbsenceAlertMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;

    public $absence;

    /**
     * Create a new message instance.
     */
    public function __construct(User $user, array $data)
    {
        $this->user = $user;
        $this->absence = $data['absence'];
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Alerte d\'absence - GIMS',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.absence_alert',
        );
    }
}

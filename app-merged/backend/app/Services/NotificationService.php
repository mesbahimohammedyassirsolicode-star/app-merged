<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

class NotificationService
{
    /**
     * Send a notification to a user.
     *
     * @param  string|null  $mailable  (Class name of the mailable)
     */
    public function notify(User $user, string $title, string $message, ?string $type = null, ?string $mailable = null, array $mailData = []): Notification
    {
        // 1. Save to database
        $notification = Notification::create([
            'user_id' => $user->id,
            'title' => $title,
            'message' => $message,
            'type' => $type, // I'll add this column in a migration
        ]);

        // 2. Send Email if mailable is provided and user has email
        if ($mailable && $user->email) {
            Mail::to($user->email)->send(new $mailable($user, $mailData));
        }

        return $notification;
    }

    /**
     * Notify student and their parent.
     */
    public function notifyStudentAndParent(User $studentUser, string $title, string $message, ?string $type = null, ?string $mailable = null, array $mailData = []): void
    {
        // Notify student
        $this->notify($studentUser, $title, $message, $type, $mailable, $mailData);

        // Notify linked parent accounts (via stagiaire ↔ parents pivot).
        $stagiaire = $studentUser->stagiaire;
        if ($stagiaire !== null) {
            $stagiaire->loadMissing('parents.user');
            foreach ($stagiaire->parents as $parentProfile) {
                $parentUser = $parentProfile->user;
                if ($parentUser !== null) {
                    $this->notify($parentUser, $title, $message, $type, $mailable, $mailData);
                }
            }
        }
    }
}

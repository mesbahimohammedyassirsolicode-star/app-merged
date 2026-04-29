<?php

namespace App\Listeners;

use App\Events\AbsenceDetected;
use App\Mail\AbsenceAlertMail;
use App\Services\NotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendAbsenceNotification implements ShouldQueue
{
    use InteractsWithQueue;

    protected $notificationService;

    /**
     * Create the event listener.
     */
    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Handle the event.
     */
    public function handle(AbsenceDetected $event): void
    {
        $absence = $event->absence;
        $student = $absence->stagiaire;

        if (! $student) {
            return;
        }

        $user = $student->user;
        if (! $user) {
            return;
        }

        $title = "Alerte d'absence";
        $message = "L'absence de l'étudiant ".$user->name.' a été détectée pour la séance du '.($absence->seance->date ?? 'N/A').'.';

        $this->notificationService->notifyStudentAndParent(
            $user,
            $title,
            $message,
            'absence_alert',
            AbsenceAlertMail::class,
            ['absence' => $absence]
        );
    }
}

<?php

namespace App\Listeners;

use App\Events\LowGradeDetected;
use App\Mail\LowGradeAlertMail;
use App\Services\NotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendLowGradeNotification implements ShouldQueue
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
    public function handle(LowGradeDetected $event): void
    {
        $note = $event->note;
        $student = $note->stagiaire;

        if (! $student) {
            return;
        }

        $user = $student->user;
        if (! $user) {
            return;
        }

        // Check if grade is low (e.g. < 10)
        if ($note->valeur >= 10) {
            return;
        }

        $title = 'Alerte de note basse';
        $message = "L'étudiant ".$user->name.' a reçu une note de '.$note->valeur.'/20 dans le module '.($note->module->nom ?? 'N/A').'.';

        $this->notificationService->notifyStudentAndParent(
            $user,
            $title,
            $message,
            'low_grade_alert',
            LowGradeAlertMail::class,
            ['note' => $note]
        );
    }
}

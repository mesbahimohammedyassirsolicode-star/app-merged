<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Attendance threshold (percent)
    |--------------------------------------------------------------------------
    | Below this rate, stagiaire is flagged "À risque" and blocked from final exam.
    */
    'attendance_threshold_percent' => (int) env('GIMS_ATTENDANCE_THRESHOLD', 80),
];

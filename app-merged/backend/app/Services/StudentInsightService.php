<?php

namespace App\Services;

class StudentInsightService
{
    public function buildInsight(float $averageGrade, float $attendanceRate): array
    {
        $riskScore = 0;
        if ($averageGrade < 10) {
            $riskScore += 55;
        } elseif ($averageGrade < 12) {
            $riskScore += 30;
        }

        if ($attendanceRate < 75) {
            $riskScore += 45;
        } elseif ($attendanceRate < 85) {
            $riskScore += 20;
        }

        $riskScore = min(100, $riskScore);
        $prediction = $riskScore >= 50 ? 'fail' : 'pass';
        $riskLevel = $riskScore >= 70 ? 'high' : ($riskScore >= 40 ? 'medium' : 'low');

        $reasons = [];
        if ($averageGrade < 10) {
            $reasons[] = 'Low grade average (< 10/20).';
        }
        if ($attendanceRate < 80) {
            $reasons[] = 'Attendance below healthy threshold (< 80%).';
        }
        if ($reasons === []) {
            $reasons[] = 'Stable grade and attendance trends.';
        }

        $recommendations = [];
        if ($averageGrade < 10) {
            $recommendations[] = 'Assign remedial module and weekly tutoring.';
            $recommendations[] = 'Focus on core weak competencies in upcoming evaluations.';
        }
        if ($attendanceRate < 80) {
            $recommendations[] = 'Set attendance recovery plan with guardian follow-up.';
        }
        if ($recommendations === []) {
            $recommendations[] = 'Offer advanced/optional module to sustain progress.';
        }

        return [
            'risk_score' => $riskScore,
            'risk_level' => $riskLevel,
            'prediction' => $prediction,
            'explanation' => implode(' ', $reasons),
            'recommendations' => $recommendations,
        ];
    }
}

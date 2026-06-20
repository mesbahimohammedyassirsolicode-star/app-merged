<?php

namespace App\Services\Copilot\Agents;

use App\Models\Attendance;
use App\Models\Note;
use App\Models\Stagiaire;
use App\Services\Copilot\AgentInterface;
use App\Services\GeminiService;

/**
 * RiskDetectionAgent — Detects failure, dropout, attendance, and performance risks.
 */
class RiskDetectionAgent implements AgentInterface
{
    public function __construct(private GeminiService $gemini) {}

    public function name(): string { return 'risk_detection'; }

    public function supportedIntents(): array
    {
        return ['risk_detection'];
    }

    public function handle(string $query, array $context): array
    {
        $scope = $context['scope'] ?? [];
        $filters = $context['filters'] ?? [];
        $data = $this->detectRisks($scope, $filters);

        $geminiResponse = $this->gemini->query($query, $data, $context['history'] ?? []);

        if ($geminiResponse) {
            return array_merge($data, [
                'summary' => $geminiResponse['summary'] ?? $this->fallbackSummary($data),
                'insights' => $geminiResponse['insights'] ?? [],
                'recommendations' => $geminiResponse['recommendations'] ?? [],
                'risk_alerts' => $geminiResponse['risk_alerts'] ?? $this->buildRiskAlerts($data),
                'chart' => $geminiResponse['chart'] ?? $this->defaultChart($data),
                'agent' => $this->name(),
                'source' => 'gemini',
            ]);
        }

        return [
            'summary' => $this->fallbackSummary($data),
            'insights' => $this->fallbackInsights($data),
            'recommendations' => $this->fallbackRecommendations($data),
            'risk_alerts' => $this->buildRiskAlerts($data),
            'chart' => $this->defaultChart($data),
            'data' => $data,
            'agent' => $this->name(),
            'source' => 'deterministic',
        ];
    }

    private function detectRisks(array $scope, array $filters): array
    {
        $studentRecordIds = $scope['student_record_ids'] ?? [];
        $studentUserIds = $scope['student_ids'] ?? [];

        if (empty($studentRecordIds)) {
            return ['at_risk_students' => [], 'risk_summary' => ['failure' => 0, 'dropout' => 0, 'attendance' => 0, 'performance' => 0]];
        }

        $students = Stagiaire::with('user:id,name')
            ->whereIn('id', $studentRecordIds)
            ->get();

        // Grades
        $grades = Note::query()
            ->join('evaluations', 'evaluations.id', '=', 'notes.evaluation_id')
            ->whereIn('notes.stagiaire_id', $studentRecordIds)
            ->when($filters['date_from'] ?? null, fn ($q, $v) => $q->where('evaluations.date', '>=', $v))
            ->when($filters['date_to'] ?? null, fn ($q, $v) => $q->where('evaluations.date', '<=', $v))
            ->selectRaw('notes.stagiaire_id, AVG(notes.valeur) as avg_grade, MIN(notes.valeur) as min_grade, COUNT(notes.id) as eval_count')
            ->groupBy('notes.stagiaire_id')
            ->get()
            ->keyBy('stagiaire_id');

        // Attendance
        $attendance = Attendance::query()
            ->whereIn('student_id', $studentUserIds)
            ->when($filters['date_from'] ?? null, fn ($q, $v) => $q->where('date', '>=', $v))
            ->when($filters['date_to'] ?? null, fn ($q, $v) => $q->where('date', '<=', $v))
            ->selectRaw('student_id, COUNT(*) as total, SUM(CASE WHEN status = "absent" THEN 1 ELSE 0 END) as absent_count')
            ->groupBy('student_id')
            ->get()
            ->keyBy('student_id');

        $atRisk = [];
        $riskCounts = ['failure' => 0, 'dropout' => 0, 'attendance' => 0, 'performance' => 0];

        foreach ($students as $student) {
            $gradeData = $grades->get($student->id);
            $attData = $attendance->get($student->user_id);

            $avgGrade = $gradeData ? round((float) $gradeData->avg_grade, 2) : null;
            $attRate = ($attData && $attData->total > 0) ? round((($attData->total - $attData->absent_count) * 100) / $attData->total, 2) : null;
            $absences = $attData ? (int) $attData->absent_count : 0;

            $risks = [];
            $riskScore = 0;

            // Failure risk
            if ($avgGrade !== null && $avgGrade < 8) {
                $risks[] = 'failure';
                $riskScore += 40;
                $riskCounts['failure']++;
            } elseif ($avgGrade !== null && $avgGrade < 10) {
                $risks[] = 'performance';
                $riskScore += 20;
                $riskCounts['performance']++;
            }

            // Attendance risk
            if ($attRate !== null && $attRate < 70) {
                $risks[] = 'dropout';
                $riskScore += 35;
                $riskCounts['dropout']++;
            } elseif ($attRate !== null && $attRate < 80) {
                $risks[] = 'attendance';
                $riskScore += 20;
                $riskCounts['attendance']++;
            }

            if (! empty($risks)) {
                $atRisk[] = [
                    'student_id' => (int) $student->id,
                    'student_name' => (string) ($student->user?->name ?? 'Inconnu'),
                    'avg_grade' => $avgGrade,
                    'attendance_rate' => $attRate,
                    'absences' => $absences,
                    'risks' => $risks,
                    'risk_score' => min($riskScore, 100),
                    'risk_level' => $riskScore >= 50 ? 'high' : ($riskScore >= 25 ? 'medium' : 'low'),
                ];
            }
        }

        usort($atRisk, fn ($a, $b) => $b['risk_score'] <=> $a['risk_score']);

        return [
            'at_risk_students' => array_slice($atRisk, 0, 15),
            'risk_summary' => $riskCounts,
            'total_at_risk' => count($atRisk),
            'total_analyzed' => count($students),
        ];
    }

    private function buildRiskAlerts(array $data): array
    {
        $alerts = [];
        $summary = $data['risk_summary'] ?? [];

        if (($summary['failure'] ?? 0) > 0) {
            $alerts[] = ['title' => 'Risque d\'échec détecté', 'level' => 'high', 'description' => ($summary['failure'] ?? 0) . " étudiant(s) en risque d'échec."];
        }
        if (($summary['dropout'] ?? 0) > 0) {
            $alerts[] = ['title' => 'Risque d\'abandon détecté', 'level' => 'high', 'description' => ($summary['dropout'] ?? 0) . " étudiant(s) en risque d'abandon (taux de présence < 70%)."];
        }
        if (($summary['attendance'] ?? 0) > 0) {
            $alerts[] = ['title' => 'Absentéisme élevé', 'level' => 'medium', 'description' => ($summary['attendance'] ?? 0) . " étudiant(s) avec un absentéisme préoccupant."];
        }

        return $alerts;
    }

    private function fallbackSummary(array $data): string
    {
        $total = $data['total_at_risk'] ?? 0;
        $analyzed = $data['total_analyzed'] ?? 0;
        return "Analyse des risques : {$total} étudiant(s) à risque identifié(s) sur {$analyzed} analysés.";
    }

    private function fallbackInsights(array $data): array
    {
        $insights = [];
        $s = $data['risk_summary'] ?? [];
        if (($s['failure'] ?? 0) > 0) $insights[] = ['title' => 'Risques d\'échec', 'detail' => ($s['failure'] ?? 0) . " étudiant(s) avec une moyenne inférieure à 8/20.", 'severity' => 'critical'];
        if (($s['dropout'] ?? 0) > 0) $insights[] = ['title' => 'Risques d\'abandon', 'detail' => ($s['dropout'] ?? 0) . " étudiant(s) avec une présence < 70%.", 'severity' => 'critical'];
        return $insights;
    }

    private function fallbackRecommendations(array $data): array
    {
        $recs = [];
        $s = $data['risk_summary'] ?? [];
        if (($s['failure'] ?? 0) > 0) {
            $recs[] = ['label' => 'Organiser un rattrapage urgent pour les étudiants en échec.', 'priority' => 'high', 'type' => 'pedagogical'];
            $recs[] = ['label' => 'Proposer du tutorat individualisé.', 'priority' => 'high', 'type' => 'pedagogical'];
        }
        if (($s['dropout'] ?? 0) > 0) {
            $recs[] = ['label' => 'Convoquer les parents des étudiants à risque d\'abandon.', 'priority' => 'high', 'type' => 'administrative'];
        }
        return $recs;
    }

    private function defaultChart(array $data): ?array
    {
        $students = array_slice($data['at_risk_students'] ?? [], 0, 10);
        if (empty($students)) return null;
        return [
            'type' => 'bar',
            'title' => 'Score de risque par étudiant',
            'labels' => array_column($students, 'student_name'),
            'datasets' => [['label' => 'Score de risque', 'data' => array_column($students, 'risk_score')]],
        ];
    }
}

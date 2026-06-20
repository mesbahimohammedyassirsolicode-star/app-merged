<?php

namespace App\Services\Copilot\Agents;

use App\Models\Attendance;
use App\Services\Copilot\AgentInterface;
use App\Services\GeminiService;
use Illuminate\Support\Facades\DB;

/**
 * AttendanceAgent — Analyzes absences, detects risky students, attendance trends.
 */
class AttendanceAgent implements AgentInterface
{
    public function __construct(private GeminiService $gemini) {}

    public function name(): string { return 'attendance'; }

    public function supportedIntents(): array
    {
        return ['attendance_analysis'];
    }

    public function handle(string $query, array $context): array
    {
        $scope = $context['scope'] ?? [];
        $filters = $context['filters'] ?? [];
        $data = $this->gatherAttendanceData($scope, $filters);

        $geminiResponse = $this->gemini->query($query, $data, $context['history'] ?? []);

        if ($geminiResponse) {
            return array_merge($data, [
                'summary' => $geminiResponse['summary'] ?? $this->fallbackSummary($data),
                'insights' => $geminiResponse['insights'] ?? [],
                'recommendations' => $geminiResponse['recommendations'] ?? [],
                'risk_alerts' => $geminiResponse['risk_alerts'] ?? [],
                'chart' => $geminiResponse['chart'] ?? $this->defaultChart($data),
                'agent' => $this->name(),
                'source' => 'gemini',
            ]);
        }

        return [
            'summary' => $this->fallbackSummary($data),
            'insights' => $this->fallbackInsights($data),
            'recommendations' => $this->fallbackRecommendations($data),
            'risk_alerts' => [],
            'chart' => $this->defaultChart($data),
            'data' => $data,
            'agent' => $this->name(),
            'source' => 'deterministic',
        ];
    }

    private function gatherAttendanceData(array $scope, array $filters): array
    {
        $studentIds = $scope['student_ids'] ?? [];

        // Per-student attendance
        $studentAttendance = Attendance::query()
            ->join('users', 'users.id', '=', 'attendances.student_id')
            ->when(! empty($studentIds), fn ($q) => $q->whereIn('attendances.student_id', $studentIds))
            ->when($filters['group_id'] ?? null, fn ($q, $v) => $q->where('attendances.group_id', (int) $v))
            ->when($filters['filiere_id'] ?? null, fn ($q, $v) => $q->where('attendances.filiere_id', (int) $v))
            ->when($filters['date_from'] ?? null, fn ($q, $v) => $q->where('attendances.date', '>=', $v))
            ->when($filters['date_to'] ?? null, fn ($q, $v) => $q->where('attendances.date', '<=', $v))
            ->selectRaw('attendances.student_id, users.name as student_name, COUNT(*) as total_sessions, SUM(CASE WHEN attendances.status = "absent" THEN 1 ELSE 0 END) as absences, SUM(CASE WHEN attendances.status IN ("present","late","retard") THEN 1 ELSE 0 END) as presences')
            ->groupBy('attendances.student_id', 'users.name')
            ->orderByDesc(DB::raw('SUM(CASE WHEN attendances.status = "absent" THEN 1 ELSE 0 END)'))
            ->limit(20)
            ->get()
            ->map(fn ($r) => [
                'student_id' => (int) $r->student_id,
                'student_name' => (string) $r->student_name,
                'total_sessions' => (int) $r->total_sessions,
                'absences' => (int) $r->absences,
                'presences' => (int) $r->presences,
                'attendance_rate' => $r->total_sessions > 0 ? round(($r->presences * 100) / $r->total_sessions, 2) : 0,
            ])
            ->values()
            ->all();

        // Frequently absent students (> 20% absence rate)
        $frequentlyAbsent = collect($studentAttendance)->filter(fn ($s) => ($s['attendance_rate'] ?? 100) < 80)->values()->all();

        // Global rate
        $totals = Attendance::query()
            ->when(! empty($studentIds), fn ($q) => $q->whereIn('student_id', $studentIds))
            ->when($filters['group_id'] ?? null, fn ($q, $v) => $q->where('group_id', (int) $v))
            ->when($filters['date_from'] ?? null, fn ($q, $v) => $q->where('date', '>=', $v))
            ->when($filters['date_to'] ?? null, fn ($q, $v) => $q->where('date', '<=', $v))
            ->selectRaw('COUNT(*) as total, SUM(CASE WHEN status IN ("present","late","retard") THEN 1 ELSE 0 END) as present')
            ->first();

        $globalRate = $totals && $totals->total > 0 ? round(($totals->present * 100) / $totals->total, 2) : 0;

        return [
            'student_attendance' => $studentAttendance,
            'frequently_absent' => $frequentlyAbsent,
            'global_attendance_rate' => $globalRate,
            'total_frequently_absent' => count($frequentlyAbsent),
        ];
    }

    private function fallbackSummary(array $data): string
    {
        $rate = $data['global_attendance_rate'] ?? 0;
        $absent = $data['total_frequently_absent'] ?? 0;
        return "Taux de présence global : {$rate}%. {$absent} étudiant(s) présentent un absentéisme fréquent (taux < 80%).";
    }

    private function fallbackInsights(array $data): array
    {
        $insights = [];
        $rate = $data['global_attendance_rate'] ?? 0;
        $absent = $data['total_frequently_absent'] ?? 0;

        if ($rate < 75) {
            $insights[] = ['title' => 'Taux de présence critique', 'detail' => "Le taux de présence global ({$rate}%) est dangereusement bas.", 'severity' => 'critical'];
        } elseif ($rate < 85) {
            $insights[] = ['title' => 'Taux de présence à surveiller', 'detail' => "Le taux de présence ({$rate}%) nécessite une attention.", 'severity' => 'warning'];
        }

        if ($absent > 0) {
            $insights[] = ['title' => "Étudiants fréquemment absents", 'detail' => "{$absent} étudiant(s) ont un taux de présence inférieur à 80%.", 'severity' => $absent > 5 ? 'critical' : 'warning'];
        }

        return $insights;
    }

    private function fallbackRecommendations(array $data): array
    {
        $recs = [];
        $rate = $data['global_attendance_rate'] ?? 0;

        if ($rate < 80) {
            $recs[] = ['label' => 'Convoquer les étudiants fréquemment absents.', 'priority' => 'high', 'type' => 'administrative'];
            $recs[] = ['label' => 'Contacter les parents des étudiants à risque.', 'priority' => 'high', 'type' => 'administrative'];
        }
        $recs[] = ['label' => 'Mettre en place un système de suivi quotidien de la présence.', 'priority' => 'medium', 'type' => 'administrative'];

        return $recs;
    }

    private function defaultChart(array $data): ?array
    {
        $students = array_slice($data['frequently_absent'] ?? [], 0, 10);
        if (empty($students)) return null;

        return [
            'type' => 'bar',
            'title' => 'Étudiants les plus souvent absents',
            'labels' => array_column($students, 'student_name'),
            'datasets' => [['label' => 'Absences', 'data' => array_column($students, 'absences')]],
        ];
    }
}

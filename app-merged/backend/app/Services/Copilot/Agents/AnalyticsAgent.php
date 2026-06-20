<?php

namespace App\Services\Copilot\Agents;

use App\Models\Attendance;
use App\Models\Note;
use App\Services\Copilot\AgentInterface;
use App\Services\GeminiService;
use Illuminate\Support\Facades\DB;

class AnalyticsAgent implements AgentInterface
{
    public function __construct(private GeminiService $gemini) {}

    public function name(): string { return 'analytics'; }

    public function supportedIntents(): array
    {
        return ['trend_analysis', 'general_question', 'student_profile'];
    }

    public function handle(string $query, array $context): array
    {
        $scope = $context['scope'] ?? [];
        $filters = $context['filters'] ?? [];
        $data = $this->gatherKPIs($scope, $filters);

        $gemini = $this->gemini->query($query, $data, $context['history'] ?? []);

        return [
            'summary' => $gemini['summary'] ?? $this->fallback($data),
            'insights' => $gemini['insights'] ?? $this->fallbackInsights($data),
            'recommendations' => $gemini['recommendations'] ?? [],
            'risk_alerts' => $gemini['risk_alerts'] ?? [],
            'chart' => $gemini['chart'] ?? $this->defaultChart($data),
            'data' => $data,
            'agent' => $this->name(),
            'source' => $gemini ? 'gemini' : 'deterministic',
        ];
    }

    private function gatherKPIs(array $scope, array $filters): array
    {
        $studentIds = $scope['student_ids'] ?? [];
        $studentRecordIds = $scope['student_record_ids'] ?? [];

        $totalStudents = ! empty($studentRecordIds)
            ? DB::table('stagiaires')->whereIn('id', $studentRecordIds)->count()
            : DB::table('stagiaires')->count();

        $totalModules = DB::table('modules')
            ->when(! empty($scope['module_ids'] ?? []), fn ($q) => $q->whereIn('id', $scope['module_ids']))
            ->count();

        $avgGrade = Note::query()
            ->join('stagiaires', 'stagiaires.id', '=', 'notes.stagiaire_id')
            ->when(! empty($studentRecordIds), fn ($q) => $q->whereIn('notes.stagiaire_id', $studentRecordIds))
            ->avg('notes.valeur');

        $attQuery = Attendance::query()
            ->when(! empty($studentIds), fn ($q) => $q->whereIn('student_id', $studentIds))
            ->when($filters['date_from'] ?? null, fn ($q, $v) => $q->where('date', '>=', $v))
            ->when($filters['date_to'] ?? null, fn ($q, $v) => $q->where('date', '<=', $v));

        $total = (clone $attQuery)->count();
        $present = (clone $attQuery)->whereIn('status', ['present', 'late', 'retard'])->count();
        $attRate = $total > 0 ? round(($present * 100) / $total, 2) : 0;

        return [
            'kpis' => [
                'total_students' => $totalStudents,
                'total_modules' => $totalModules,
                'average_grade' => round((float) ($avgGrade ?? 0), 2),
                'attendance_rate' => $attRate,
            ],
        ];
    }

    private function fallback(array $data): string
    {
        $k = $data['kpis'] ?? [];
        return "Vue d'ensemble : {$k['total_students']} stagiaires, moyenne {$k['average_grade']}/20, taux de présence {$k['attendance_rate']}%.";
    }

    private function fallbackInsights(array $data): array
    {
        $k = $data['kpis'] ?? [];
        $insights = [];
        if (($k['attendance_rate'] ?? 100) < 80) {
            $insights[] = ['title' => 'Présence faible', 'detail' => "Le taux de présence ({$k['attendance_rate']}%) est inférieur à 80%.", 'severity' => 'warning'];
        }
        if (($k['average_grade'] ?? 20) < 10) {
            $insights[] = ['title' => 'Moyenne insuffisante', 'detail' => "La moyenne générale ({$k['average_grade']}/20) est sous le seuil.", 'severity' => 'critical'];
        }
        return $insights;
    }

    private function defaultChart(array $data): ?array
    {
        $k = $data['kpis'] ?? [];
        return [
            'type' => 'bar',
            'title' => 'Indicateurs clés',
            'labels' => ['Présence (%)', 'Moyenne (/20)'],
            'datasets' => [['label' => 'Valeur', 'data' => [$k['attendance_rate'] ?? 0, $k['average_grade'] ?? 0]]],
        ];
    }
}

<?php

namespace App\Services\Copilot\Agents;

use App\Models\Note;
use App\Models\Stagiaire;
use App\Services\Copilot\AgentInterface;
use App\Services\GeminiService;
use Illuminate\Support\Facades\DB;

/**
 * AcademicAgent — Analyzes grades, modules, groups, and educational performance.
 */
class AcademicAgent implements AgentInterface
{
    public function __construct(
        private GeminiService $gemini
    ) {}

    public function name(): string
    {
        return 'academic';
    }

    public function supportedIntents(): array
    {
        return ['academic_analysis', 'group_comparison', 'trend_analysis'];
    }

    public function handle(string $query, array $context): array
    {
        $scope = $context['scope'] ?? [];
        $filters = $context['filters'] ?? [];

        // Gather academic data based on scope
        $data = $this->gatherAcademicData($scope, $filters);

        // Use Gemini for intelligent analysis
        $geminiResponse = $this->gemini->query($query, $data, $context['history'] ?? []);

        if ($geminiResponse) {
            return array_merge($data, [
                'summary' => $geminiResponse['summary'] ?? $this->buildFallbackSummary($data),
                'insights' => $geminiResponse['insights'] ?? [],
                'recommendations' => $geminiResponse['recommendations'] ?? [],
                'risk_alerts' => $geminiResponse['risk_alerts'] ?? [],
                'chart' => $geminiResponse['chart'] ?? $this->buildDefaultChart($data),
                'agent' => $this->name(),
                'source' => 'gemini',
            ]);
        }

        // Fallback to deterministic analysis
        return [
            'summary' => $this->buildFallbackSummary($data),
            'insights' => $this->buildFallbackInsights($data),
            'recommendations' => $this->buildFallbackRecommendations($data),
            'risk_alerts' => [],
            'chart' => $this->buildDefaultChart($data),
            'data' => $data,
            'agent' => $this->name(),
            'source' => 'deterministic',
        ];
    }

    private function gatherAcademicData(array $scope, array $filters): array
    {
        $studentIds = $scope['student_record_ids'] ?? [];

        // Module performance
        $modulePerformance = Note::query()
            ->join('evaluations', 'evaluations.id', '=', 'notes.evaluation_id')
            ->join('modules', 'modules.id', '=', 'evaluations.module_id')
            ->join('stagiaires', 'stagiaires.id', '=', 'notes.stagiaire_id')
            ->when(! empty($studentIds), fn ($q) => $q->whereIn('notes.stagiaire_id', $studentIds))
            ->when($filters['group_id'] ?? null, fn ($q, $v) => $q->where('evaluations.groupe_id', (int) $v))
            ->when($filters['filiere_id'] ?? null, fn ($q, $v) => $q->where('stagiaires.filiere_id', (int) $v))
            ->when($filters['date_from'] ?? null, fn ($q, $v) => $q->where('evaluations.date', '>=', $v))
            ->when($filters['date_to'] ?? null, fn ($q, $v) => $q->where('evaluations.date', '<=', $v))
            ->selectRaw('modules.id as module_id, COALESCE(modules.label, modules.name) as module_name, modules.code as module_code, AVG(notes.valeur) as avg_grade, COUNT(DISTINCT notes.stagiaire_id) as student_count, MIN(notes.valeur) as min_grade, MAX(notes.valeur) as max_grade')
            ->groupBy('modules.id', 'modules.label', 'modules.name', 'modules.code')
            ->orderByDesc('avg_grade')
            ->limit(20)
            ->get()
            ->map(fn ($r) => [
                'module_id' => (int) $r->module_id,
                'module_name' => (string) $r->module_name,
                'module_code' => (string) $r->module_code,
                'avg_grade' => round((float) $r->avg_grade, 2),
                'student_count' => (int) $r->student_count,
                'min_grade' => round((float) $r->min_grade, 2),
                'max_grade' => round((float) $r->max_grade, 2),
            ])
            ->values()
            ->all();

        // Group performance
        $groupPerformance = Note::query()
            ->join('evaluations', 'evaluations.id', '=', 'notes.evaluation_id')
            ->join('groupes', 'groupes.id', '=', 'evaluations.groupe_id')
            ->join('stagiaires', 'stagiaires.id', '=', 'notes.stagiaire_id')
            ->when(! empty($studentIds), fn ($q) => $q->whereIn('notes.stagiaire_id', $studentIds))
            ->when($filters['filiere_id'] ?? null, fn ($q, $v) => $q->where('groupes.filiere_id', (int) $v))
            ->when($filters['date_from'] ?? null, fn ($q, $v) => $q->where('evaluations.date', '>=', $v))
            ->when($filters['date_to'] ?? null, fn ($q, $v) => $q->where('evaluations.date', '<=', $v))
            ->selectRaw('groupes.id as group_id, groupes.name as group_name, AVG(notes.valeur) as avg_grade, COUNT(DISTINCT notes.stagiaire_id) as student_count')
            ->groupBy('groupes.id', 'groupes.name')
            ->orderByDesc('avg_grade')
            ->limit(20)
            ->get()
            ->map(fn ($r) => [
                'group_id' => (int) $r->group_id,
                'group_name' => (string) $r->group_name,
                'avg_grade' => round((float) $r->avg_grade, 2),
                'student_count' => (int) $r->student_count,
            ])
            ->values()
            ->all();

        // Overall statistics
        $overallAvg = Note::query()
            ->join('stagiaires', 'stagiaires.id', '=', 'notes.stagiaire_id')
            ->join('evaluations', 'evaluations.id', '=', 'notes.evaluation_id')
            ->when(! empty($studentIds), fn ($q) => $q->whereIn('notes.stagiaire_id', $studentIds))
            ->when($filters['group_id'] ?? null, fn ($q, $v) => $q->where('evaluations.groupe_id', (int) $v))
            ->when($filters['filiere_id'] ?? null, fn ($q, $v) => $q->where('stagiaires.filiere_id', (int) $v))
            ->avg('notes.valeur');

        return [
            'module_performance' => $modulePerformance,
            'group_performance' => $groupPerformance,
            'overall_average' => round((float) ($overallAvg ?? 0), 2),
            'total_modules_analyzed' => count($modulePerformance),
            'total_groups_analyzed' => count($groupPerformance),
        ];
    }

    private function buildFallbackSummary(array $data): string
    {
        $avg = $data['overall_average'] ?? 0;
        $modules = $data['total_modules_analyzed'] ?? 0;
        $groups = $data['total_groups_analyzed'] ?? 0;

        return "Analyse académique : moyenne générale de {$avg}/20 sur {$modules} modules et {$groups} groupes dans le périmètre actuel.";
    }

    private function buildFallbackInsights(array $data): array
    {
        $insights = [];
        $avg = $data['overall_average'] ?? 0;

        if ($avg < 10) {
            $insights[] = [
                'title' => 'Moyenne générale insuffisante',
                'detail' => "La moyenne générale ({$avg}/20) est en dessous du seuil de validation.",
                'severity' => 'critical',
            ];
        } elseif ($avg < 12) {
            $insights[] = [
                'title' => 'Moyenne générale à surveiller',
                'detail' => "La moyenne générale ({$avg}/20) est juste au-dessus du seuil de validation.",
                'severity' => 'warning',
            ];
        } else {
            $insights[] = [
                'title' => 'Performance académique satisfaisante',
                'detail' => "La moyenne générale ({$avg}/20) indique une bonne performance globale.",
                'severity' => 'positive',
            ];
        }

        // Check for weak modules
        $weakModules = collect($data['module_performance'] ?? [])->filter(fn ($m) => ($m['avg_grade'] ?? 20) < 10);
        if ($weakModules->isNotEmpty()) {
            $insights[] = [
                'title' => 'Modules en difficulté',
                'detail' => $weakModules->count() . " module(s) avec une moyenne inférieure à 10/20.",
                'severity' => 'warning',
            ];
        }

        return $insights;
    }

    private function buildFallbackRecommendations(array $data): array
    {
        $recs = [];
        $avg = $data['overall_average'] ?? 0;

        if ($avg < 10) {
            $recs[] = ['label' => 'Organiser des séances de rattrapage pour les modules les plus faibles.', 'priority' => 'high', 'type' => 'pedagogical'];
            $recs[] = ['label' => 'Renforcer le suivi pédagogique individualisé.', 'priority' => 'high', 'type' => 'pedagogical'];
        }
        if ($avg < 12) {
            $recs[] = ['label' => 'Mettre en place du tutorat entre pairs.', 'priority' => 'medium', 'type' => 'pedagogical'];
        }

        $weakModules = collect($data['module_performance'] ?? [])->filter(fn ($m) => ($m['avg_grade'] ?? 20) < 10);
        if ($weakModules->isNotEmpty()) {
            $recs[] = ['label' => 'Revoir la méthodologie pédagogique des modules en difficulté.', 'priority' => 'high', 'type' => 'pedagogical'];
        }

        return $recs;
    }

    private function buildDefaultChart(array $data): ?array
    {
        $groups = $data['group_performance'] ?? [];
        if (empty($groups)) {
            return null;
        }

        return [
            'type' => 'bar',
            'title' => 'Performance par groupe',
            'labels' => array_column($groups, 'group_name'),
            'datasets' => [
                [
                    'label' => 'Moyenne',
                    'data' => array_column($groups, 'avg_grade'),
                ],
            ],
        ];
    }
}

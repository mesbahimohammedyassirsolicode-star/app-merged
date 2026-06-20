<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * GeminiService — Handles communication with Google Gemini API.
 *
 * System prompt positions the AI as a professional French-speaking
 * educational analytics copilot. Never exposes SQL or raw data.
 */
class GeminiService
{
    private string $apiKey;
    private string $model;
    private string $baseUrl;
    private int $timeout;

    private const SYSTEM_PROMPT = <<<'PROMPT'
Tu es GIMS Academic Copilot, un expert en analyse éducative.

Tu aides les administrateurs scolaires, les formateurs et les directeurs d'établissements de formation professionnelle.

Règles strictes :
- Tu ne révèles JAMAIS de requêtes SQL ni de détails techniques internes.
- Tu analyses les données éducatives de manière professionnelle.
- Tu identifies les risques (échec, abandon, absentéisme, baisse de performance).
- Tu génères des recommandations pédagogiques et administratives concrètes.
- Tu expliques tes conclusions de manière claire et structurée.
- Tu communiques exclusivement en français professionnel.
- Tu structures tes réponses avec des sections claires.
- Tu utilises des données chiffrées pour appuyer tes analyses.
- Tu proposes toujours des actions correctives réalistes.

Format de réponse attendu (JSON) :
{
  "summary": "Résumé concis de l'analyse",
  "insights": [
    {"title": "Titre de l'insight", "detail": "Description détaillée", "severity": "critical|warning|positive|neutral"}
  ],
  "recommendations": [
    {"label": "Recommandation", "priority": "high|medium|low", "type": "pedagogical|administrative|corrective"}
  ],
  "risk_alerts": [
    {"title": "Alerte", "level": "high|medium|low", "description": "Description"}
  ],
  "chart": {
    "type": "bar|pie|line|area",
    "title": "Titre du graphique",
    "labels": ["Label1", "Label2"],
    "datasets": [{"label": "Série", "data": [10, 20]}]
  }
}

Retourne UNIQUEMENT du JSON valide. Pas de markdown. Pas d'explication hors JSON.
PROMPT;

    public function __construct()
    {
        $this->apiKey = (string) config('services.gemini.api_key', '');
        $this->model = (string) config('services.gemini.model', 'gemini-2.0-flash');
        $this->baseUrl = rtrim((string) config('services.gemini.base_url', 'https://generativelanguage.googleapis.com/v1beta'), '/');
        $this->timeout = (int) config('services.gemini.timeout', 30);
    }

    /**
     * Send a contextual query to Gemini with educational data context.
     */
    public function query(string $userMessage, array $context = [], array $conversationHistory = []): ?array
    {
        if ($this->apiKey === '') {
            Log::warning('GeminiService: No API key configured');
            return null;
        }

        $contents = $this->buildContents($userMessage, $context, $conversationHistory);

        try {
            $response = Http::timeout($this->timeout)
                ->acceptJson()
                ->post("{$this->baseUrl}/models/{$this->model}:generateContent?key={$this->apiKey}", [
                    'system_instruction' => [
                        'parts' => [['text' => self::SYSTEM_PROMPT]],
                    ],
                    'contents' => $contents,
                    'generationConfig' => [
                        'temperature' => 0.3,
                        'maxOutputTokens' => 4096,
                        'responseMimeType' => 'application/json',
                    ],
                ]);

            if (! $response->successful()) {
                Log::warning('GeminiService: API request failed', [
                    'status' => $response->status(),
                    'body' => substr($response->body(), 0, 500),
                ]);
                return null;
            }

            $content = data_get($response->json(), 'candidates.0.content.parts.0.text');
            if (! is_string($content) || trim($content) === '') {
                return null;
            }

            $decoded = json_decode($content, true);
            return is_array($decoded) ? $decoded : null;

        } catch (\Throwable $exception) {
            Log::warning('GeminiService: Exception', [
                'message' => $exception->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Generate a natural language summary from structured data.
     */
    public function summarize(array $data, string $context): ?string
    {
        $prompt = "Analyse ces données éducatives et fournis un résumé professionnel en français.\n\nContexte: {$context}\n\nDonnées:\n" . json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

        $result = $this->query($prompt);
        return $result['summary'] ?? null;
    }

    /**
     * Detect the user's intent using Gemini.
     */
    public function detectIntent(string $query): ?array
    {
        $intentPrompt = <<<PROMPT
Analyse cette question et détermine l'intention de l'utilisateur.

Question: {$query}

Intentions possibles:
- academic_analysis: Analyse des notes, moyennes, performances académiques
- attendance_analysis: Analyse des présences, absences, tendances d'assiduité
- risk_detection: Détection d'étudiants à risque (échec, abandon, absentéisme)
- recommendation: Demande de recommandations pédagogiques ou administratives
- report_generation: Génération de rapport
- group_comparison: Comparaison entre groupes ou filières
- student_profile: Profil ou situation d'un étudiant spécifique
- trend_analysis: Analyse de tendances sur une période
- general_question: Question générale sur l'établissement

Retourne un JSON avec:
{
  "intent": "nom_de_l_intention",
  "confidence": 0.0-1.0,
  "entities": {
    "group": "nom du groupe si mentionné ou null",
    "filiere": "nom de la filière si mentionnée ou null",
    "module": "nom du module si mentionné ou null",
    "student": "nom de l'étudiant si mentionné ou null",
    "period": "période si mentionnée ou null"
  },
  "language": "fr|en"
}
PROMPT;

        return $this->query($intentPrompt);
    }

    /**
     * Check if the service is available.
     */
    public function isAvailable(): bool
    {
        return $this->apiKey !== '';
    }

    private function buildContents(string $userMessage, array $context, array $conversationHistory): array
    {
        $contents = [];

        // Add conversation history for context continuity
        foreach ($conversationHistory as $message) {
            $role = ($message['role'] ?? 'user') === 'assistant' ? 'model' : 'user';
            $contents[] = [
                'role' => $role,
                'parts' => [['text' => (string) ($message['content'] ?? $message['message'] ?? '')]],
            ];
        }

        // Build the current message with data context
        $contextBlock = '';
        if (! empty($context)) {
            $contextBlock = "\n\n--- DONNÉES CONTEXTUELLES ---\n" . json_encode($context, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n--- FIN DES DONNÉES ---\n\n";
        }

        $contents[] = [
            'role' => 'user',
            'parts' => [['text' => $contextBlock . $userMessage]],
        ];

        return $contents;
    }
}

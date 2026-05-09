<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class LLMService
{
    /**
     * Ask the configured LLM provider for structured intent extraction.
     */
    public function extractIntentAndFilters(string $query): ?array
    {
        $apiKey = (string) config('services.openai.api_key');
        if ($apiKey === '') {
            return null;
        }

        $model = (string) config('services.openai.model', 'gpt-4o-mini');
        $baseUrl = rtrim((string) config('services.openai.base_url', 'https://api.openai.com/v1'), '/');
        $timeout = (int) config('services.openai.timeout', 8);

        $prompt = $this->buildPrompt($query);

        try {
            $response = Http::timeout($timeout)
                ->withToken($apiKey)
                ->acceptJson()
                ->post($baseUrl.'/chat/completions', [
                    'model' => $model,
                    'temperature' => 0,
                    'response_format' => ['type' => 'json_object'],
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => 'You are a strict JSON extraction engine. Return JSON only.',
                        ],
                        [
                            'role' => 'user',
                            'content' => $prompt,
                        ],
                    ],
                ]);

            if (! $response->successful()) {
                Log::warning('LLM extraction request failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return null;
            }

            $content = data_get($response->json(), 'choices.0.message.content');
            if (! is_string($content) || trim($content) === '') {
                return null;
            }

            $decoded = json_decode($content, true);

            return is_array($decoded) ? $decoded : null;
        } catch (\Throwable $exception) {
            Log::warning('LLM extraction exception', [
                'message' => $exception->getMessage(),
            ]);

            return null;
        }
    }

    private function buildPrompt(string $query): string
    {
        return <<<PROMPT
Extract analytics intent and filters from this user query.

Allowed intents:
- students_at_risk
- average_performance
- top_students
- attendance_report
- grades_by_module

Allowed filters keys:
- date_range (one of: this_month, last_6_months, this_week, this_year, none)
- module (string value, short label if present)
- group (string value, short label if present)

Rules:
- Return valid JSON only.
- No markdown.
- No explanation.
- Always include "intent".
- Always include "filters" as an object.
- If no date detected, use "none" for date_range.
- If unsure about intent, use "average_performance".

User query:
{$query}

Expected JSON format:
{"intent":"average_performance","filters":{"date_range":"this_month","module":null,"group":null}}
PROMPT;
    }
}

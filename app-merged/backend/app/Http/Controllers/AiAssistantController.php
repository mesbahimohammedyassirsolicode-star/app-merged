<?php

namespace App\Http\Controllers;

use App\Http\Requests\AiAssistantExportRequest;
use App\Http\Requests\AiAssistantQueryRequest;
use App\Services\AiAssistantService;
use Barryvdh\DomPDF\Facade\Pdf;

class AiAssistantController extends Controller
{
    public function __construct(
        private AiAssistantService $aiAssistantService
    ) {}

    public function ask(AiAssistantQueryRequest $request)
    {
        $result = $this->aiAssistantService->handle(
            $request->user(),
            (string) $request->validated('query')
        );

        return $this->success($result);
    }

    public function export(AiAssistantExportRequest $request)
    {
        $payload = $request->validated();
        $format = $payload['format'];
        $rows = $this->normalizeRows($payload['data']);
        $summary = (string) $payload['summary'];
        $insights = is_array($payload['insights'] ?? null) ? $payload['insights'] : [];

        if ($format === 'csv') {
            $filename = 'ai-assistant-export-'.now()->format('Ymd-His').'.csv';

            return response()->streamDownload(function () use ($rows, $summary, $insights) {
                $output = fopen('php://output', 'wb');

                fputcsv($output, ['summary', $summary]);
                foreach ($insights as $insight) {
                    fputcsv($output, ['insight', (string) $insight]);
                }

                if ($rows !== []) {
                    fputcsv($output, []);
                    fputcsv($output, array_keys($rows[0]));
                    foreach ($rows as $row) {
                        fputcsv($output, $row);
                    }
                }

                fclose($output);
            }, $filename, [
                'Content-Type' => 'text/csv; charset=UTF-8',
            ]);
        }

        $pdf = Pdf::loadView('pdf.ai-assistant-export', [
            'generatedAt' => now()->toDateTimeString(),
            'summary' => $summary,
            'insights' => $insights,
            'rows' => $rows,
        ]);

        return $pdf->download('ai-assistant-export-'.now()->format('Ymd-His').'.pdf');
    }

    private function normalizeRows(mixed $data): array
    {
        if (! is_array($data)) {
            return [];
        }

        if (array_is_list($data)) {
            return collect($data)
                ->filter(fn ($row) => is_array($row))
                ->map(function (array $row) {
                    $normalized = [];
                    foreach ($row as $key => $value) {
                        $normalized[(string) $key] = is_scalar($value) || $value === null
                            ? $value
                            : json_encode($value);
                    }

                    return $normalized;
                })
                ->values()
                ->all();
        }

        return [[
            'metric' => 'payload',
            'value' => json_encode($data),
        ]];
    }
}

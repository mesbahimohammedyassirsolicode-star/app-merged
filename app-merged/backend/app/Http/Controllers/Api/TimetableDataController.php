<?php

namespace App\Http\Controllers\Api;

use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Serves timetable data directly from the JSON source files stored in
 * database/data/*_emploi_*.json, bypassing the database entirely.
 *
 * Each JSON file contains a recurring weekly schedule (Monday–Saturday)
 * for one filière. This controller maps the day names to real calendar
 * dates based on the requested week_start so the frontend can render
 * a standard week-grid without any changes.
 */
class TimetableDataController extends BaseApiController
{
    private const DAY_OFFSETS = [
        'monday' => 0,
        'tuesday' => 1,
        'wednesday' => 2,
        'thursday' => 3,
        'friday' => 4,
        'saturday' => 5,
        'sunday' => 6,
        // French aliases (some files might use them)
        'lundi' => 0,
        'mardi' => 1,
        'mercredi' => 2,
        'jeudi' => 3,
        'vendredi' => 4,
        'samedi' => 5,
        'dimanche' => 6,
    ];

    // ── Public endpoints ──────────────────────────────────────────────────────

    /**
     * GET /api/v1/timetable-data/filieres
     * Returns one entry per filière extracted from the emploi JSON files.
     */
    public function filieres(): JsonResponse
    {
        $items = [];
        $seen = [];

        foreach ($this->scanFiles() as $file) {
            $data = $this->loadFile($file);
            if (! $data) {
                continue;
            }

            $meta = $data['meta'] ?? [];
            $code = strtoupper(trim((string) ($meta['filiere_code'] ?? '')));

            if ($code === '' || isset($seen[$code])) {
                continue;
            }

            $seen[$code] = true;
            $items[] = [
                'code' => $code,
                'label' => $meta['filiere_label'] ?? $code,
                'group_label' => $meta['group_label'] ?? null,
                'academic_year' => $meta['academic_year'] ?? null,
                'session' => $meta['session'] ?? null,
                'source' => $meta['source'] ?? null,
                'file' => basename($file),
            ];
        }

        // Consistent alphabetical ordering by code
        usort($items, fn ($a, $b) => strcmp($a['code'], $b['code']));

        return $this->success($items);
    }

    /**
     * GET /api/v1/timetable-data?filiere_code=TGI&week_start=2026-04-21
     * Returns a timetable response (same shape as GET /schedules) built from
     * the JSON file matching the given filiere_code.
     */
    public function index(Request $request): JsonResponse
    {
        $code = strtoupper(trim((string) ($request->query('filiere_code', ''))));
        $weekStart = $request->query('week_start');

        [$start, $end] = $this->resolveWeekRange($weekStart);

        if ($code === '') {
            return $this->success($this->emptyPayload($start, $end, null));
        }

        $data = $this->findByCode($code);

        if (! $data) {
            return $this->success($this->emptyPayload($start, $end, $code));
        }

        $seances = $this->buildSeances($data, $start, $code);

        $byDate = [];
        foreach ($seances as $s) {
            $byDate[$s['date']][] = $s;
        }

        // Build unique modules list for this filière
        $modulesMap = [];
        foreach ($data['seances'] ?? [] as $s) {
            $mc = $s['module_code'] ?? null;
            if ($mc && ! isset($modulesMap[$mc])) {
                $modulesMap[$mc] = [
                    'code' => $mc,
                    'label' => $s['module_label'] ?? $mc,
                ];
            }
        }

        $meta = $data['meta'] ?? [];

        return $this->success([
            'week_start' => $start->toDateString(),
            'week_end' => $end->toDateString(),
            'filiere_code' => $code,
            'filiere_label' => $meta['filiere_label'] ?? $code,
            'group_label' => $meta['group_label'] ?? null,
            'academic_year' => $meta['academic_year'] ?? null,
            'session' => $meta['session'] ?? null,
            'time_slots' => $data['time_slots'] ?? [],
            'modules' => array_values($modulesMap),
            'schedules' => $seances,
            'by_date' => (object) $byDate,
            'scope' => [
                'filiere_code' => $code,
                'effective_filiere_id' => null,
                'effective_group_ids' => [],
            ],
        ]);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private function resolveWeekRange(?string $weekStart): array
    {
        try {
            $start = $weekStart
                ? Carbon::parse($weekStart)->startOfWeek(Carbon::MONDAY)->startOfDay()
                : Carbon::now()->startOfWeek(Carbon::MONDAY)->startOfDay();
        } catch (\Throwable) {
            $start = Carbon::now()->startOfWeek(Carbon::MONDAY)->startOfDay();
        }

        return [$start, $start->copy()->addDays(6)->endOfDay()];
    }

    private function emptyPayload(Carbon $start, Carbon $end, ?string $code): array
    {
        return [
            'week_start' => $start->toDateString(),
            'week_end' => $end->toDateString(),
            'filiere_code' => $code,
            'filiere_label' => null,
            'schedules' => [],
            'by_date' => (object) [],
            'modules' => [],
            'time_slots' => [],
            'scope' => [
                'filiere_code' => $code,
                'effective_filiere_id' => null,
                'effective_group_ids' => [],
            ],
        ];
    }

    /**
     * Return all emploi JSON files (exclude academic.json and any non-emploi files).
     *
     * @return string[]
     */
    private function scanFiles(): array
    {
        $dir = database_path('data');

        if (! is_dir($dir)) {
            return [];
        }

        $files = glob($dir.DIRECTORY_SEPARATOR.'*_emploi_*.json');

        return is_array($files) ? $files : [];
    }

    private function loadFile(string $path): ?array
    {
        if (! file_exists($path)) {
            return null;
        }

        $contents = file_get_contents($path);
        if ($contents === false) {
            return null;
        }

        $decoded = json_decode($contents, true);

        return is_array($decoded) ? $decoded : null;
    }

    private function findByCode(string $code): ?array
    {
        foreach ($this->scanFiles() as $file) {
            $data = $this->loadFile($file);
            if (! $data) {
                continue;
            }

            $fileCode = strtoupper(trim((string) ($data['meta']['filiere_code'] ?? '')));
            if ($fileCode === $code) {
                return $data;
            }
        }

        return null;
    }

    /**
     * Convert recurring day-name entries in the JSON into dated séance objects
     * for the requested week.
     *
     * @return array<int, array<string, mixed>>
     */
    private function buildSeances(array $data, Carbon $weekStart, string $code): array
    {
        $raw = $data['seances'] ?? [];
        $meta = $data['meta'] ?? [];
        $result = [];
        $id = 1;

        foreach ($raw as $entry) {
            $dayKey = strtolower(trim((string) ($entry['day'] ?? '')));
            $offset = self::DAY_OFFSETS[$dayKey] ?? null;

            if ($offset === null) {
                continue;
            }

            $date = $weekStart->copy()->addDays($offset)->toDateString();

            $result[] = [
                'id' => $id++,
                'date' => $date,
                'day' => $entry['day'],
                'start_time' => $entry['start'] ?? null,
                'end_time' => $entry['end'] ?? null,
                'shift' => $entry['shift'] ?? null,
                'subject' => $entry['module_label'] ?? null,
                'salle' => $entry['room'] ?? null,
                'status' => 'planifie',
                'type' => 'presentiel',
                'scope' => 'filiere',
                'filiere_code' => $code,
                'group_label' => $meta['group_label'] ?? null,
                'module' => [
                    'code' => $entry['module_code'] ?? null,
                    'label' => $entry['module_label'] ?? null,
                ],
                'teacher' => [
                    'name' => $entry['teacher'] ?? null,
                ],
                'groupe' => $meta['group_label']
                    ? ['label' => $meta['group_label']]
                    : null,
            ];
        }

        // Sort by date then start_time
        usort($result, function ($a, $b) {
            $dateCmp = strcmp((string) $a['date'], (string) $b['date']);
            if ($dateCmp !== 0) {
                return $dateCmp;
            }

            return strcmp((string) $a['start_time'], (string) $b['start_time']);
        });

        return $result;
    }
}

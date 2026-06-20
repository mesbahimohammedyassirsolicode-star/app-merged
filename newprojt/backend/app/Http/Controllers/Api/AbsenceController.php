<?php

namespace App\Http\Controllers\Api;

use App\Models\Absence;
use App\Models\Eleve;
use App\Models\Classe;
use App\Http\Requests\StoreAbsenceRequest;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class AbsenceController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $query = Absence::with(['eleve', 'classe']);

        if ($request->has('date')) {
            $query->where('date', $request->date);
        }

        if ($request->has('classe_id')) {
            $query->where('classe_id', $request->classe_id);
        }

        if ($request->has('justifiee')) {
            $query->where('justifiee', $request->justifiee);
        }

        $absences = $query->paginate(15);
        return $this->sendResponse($absences, 'Absences retrieved successfully.');
    }

    public function getStats(): JsonResponse
    {
        $today = Carbon::today()->toDateString();
        $totalEleves = Eleve::count();
        $absencesToday = Absence::where('date', $today)->distinct('eleve_id')->count();
        $justified = Absence::where('date', $today)->where('justifiee', true)->distinct('eleve_id')->count();
        $nonJustified = $absencesToday - $justified;

        return $this->sendResponse([
            'total' => $absencesToday,
            'percentage' => $totalEleves > 0 ? round(($absencesToday / $totalEleves) * 100, 2) : 0,
            'justifiees' => $justified,
            'non_justifiees' => $nonJustified,
        ], 'Absence stats retrieved successfully.');
    }

    public function store(StoreAbsenceRequest $request): JsonResponse
    {
        $absence = Absence::create($request->validated());
        return $this->sendResponse($absence, 'Absence registered successfully.');
    }

    public function justifier(Request $request, $id): JsonResponse
    {
        $absence = Absence::find($id);
        if (is_null($absence)) return $this->sendError('Absence not found.');

        $absence->update([
            'justifiee' => true,
            'motif' => $request->motif ?? $absence->motif,
            'justificatif_path' => $request->justificatif_path ?? $absence->justificatif_path,
        ]);

        return $this->sendResponse($absence, 'Absence justified successfully.');
    }

    public function getRapport(): JsonResponse
    {
        $rapportClasses = Classe::withCount(['absences' => function ($query) {
            $query->where('date', '>=', Carbon::now()->subDays(30));
        }])->get();

        $trend = [];
        for ($i = 29; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i)->toDateString();
            $count = Absence::where('date', $date)->distinct('eleve_id')->count();
            $trend[] = ['date' => $date, 'count' => $count];
        }

        return $this->sendResponse([
            'per_classe' => $rapportClasses,
            'trend' => $trend,
        ], 'Absence report retrieved successfully.');
    }
}

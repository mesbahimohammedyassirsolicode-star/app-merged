<?php

namespace App\Http\Controllers\Api;

use App\Models\EmploiDuTemps;
use App\Http\Requests\StoreEmploiDuTempsRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class EmploiDuTempsController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $query = EmploiDuTemps::with(['classe', 'enseignant', 'matiere']);

        if ($request->has('classe_id')) {
            $query->where('classe_id', $request->classe_id);
        }

        if ($request->has('enseignant_id')) {
            $query->where('enseignant_id', $request->enseignant_id);
        }

        $sessions = $query->get();
        return $this->sendResponse($sessions, 'Timetable sessions retrieved successfully.');
    }

    public function store(StoreEmploiDuTempsRequest $request): JsonResponse
    {
        $data = $request->validated();

        // Conflict detection
        $conflict = EmploiDuTemps::where('jour_semaine', $data['jour_semaine'])
            ->where(function ($query) use ($data) {
                $query->where(function ($q) use ($data) {
                    $q->where('heure_debut', '<', $data['heure_fin'])
                      ->where('heure_fin', '>', $data['heure_debut']);
                });
            })
            ->where(function ($query) use ($data) {
                $query->where('classe_id', $data['classe_id'])
                      ->orWhere('enseignant_id', $data['enseignant_id'])
                      ->orWhere('salle', $data['salle']);
            })
            ->first();

        if ($conflict) {
            return $this->sendError('Conflict detected with another session.', [
                'conflict' => $conflict,
                'type' => $conflict->classe_id == $data['classe_id'] ? 'classe' : 
                          ($conflict->enseignant_id == $data['enseignant_id'] ? 'enseignant' : 'salle')
            ], 422);
        }

        $session = EmploiDuTemps::create($data);
        return $this->sendResponse($session, 'Timetable session created successfully.');
    }

    public function update(StoreEmploiDuTempsRequest $request, EmploiDuTemps $emploiDuTemps): JsonResponse
    {
        $emploiDuTemps->update($request->validated());
        return $this->sendResponse($emploiDuTemps, 'Timetable session updated successfully.');
    }

    public function destroy(EmploiDuTemps $emploiDuTemps): JsonResponse
    {
        $emploiDuTemps->delete();
        return $this->sendResponse([], 'Timetable session deleted successfully.');
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Models\Note;
use App\Models\Eleve;
use App\Models\Matiere;
use App\Http\Requests\BulkNoteRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\JsonResponse;

class NoteController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $query = Note::with(['eleve', 'matiere', 'enseignant']);

        if ($request->has('classe_id')) {
            $query->whereHas('eleve', function ($q) use ($request) {
                $q->where('classe_id', $request->classe_id);
            });
        }

        if ($request->has('matiere_id')) {
            $query->where('matiere_id', $request->matiere_id);
        }

        if ($request->has('trimestre')) {
            $query->where('trimestre', $request->trimestre);
        }

        $notes = $query->paginate(30);
        return $this->sendResponse($notes, 'Notes retrieved successfully.');
    }

    public function bulkStore(BulkNoteRequest $request): JsonResponse
    {
        $data = $request->validated();
        $createdNotes = [];

        return DB::transaction(function () use ($data, &$createdNotes) {
            foreach ($data['notes'] as $noteData) {
                $createdNotes[] = Note::updateOrCreate(
                    [
                        'eleve_id' => $noteData['eleve_id'],
                        'matiere_id' => $data['matiere_id'],
                        'trimestre' => $data['trimestre'],
                        'type_evaluation' => $data['type_evaluation'],
                    ],
                    [
                        'valeur' => $noteData['valeur'],
                        'enseignant_id' => auth()->user()->enseignant->id ?? null,
                    ]
                );
            }

            return $this->sendResponse($createdNotes, 'Notes saved successfully.');
        });
    }

    public function getBulletin($eleve_id, $trimestre): JsonResponse
    {
        $eleve = Eleve::with('classe.niveau')->find($eleve_id);
        if (is_null($eleve)) return $this->sendError('Eleve not found.');

        $notes = Note::with('matiere')
            ->where('eleve_id', $eleve_id)
            ->where('trimestre', $trimestre)
            ->get();

        $bulletin = $notes->groupBy('matiere_id')->map(function ($notesByMatiere) {
            $matiere = $notesByMatiere->first()->matiere;
            $average = $notesByMatiere->avg('valeur');
            return [
                'matiere' => $matiere->name,
                'notes' => $notesByMatiere,
                'average' => round($average, 2),
            ];
        })->values();

        $overallAverage = $bulletin->avg('average');

        return $this->sendResponse([
            'student' => $eleve,
            'trimestre' => $trimestre,
            'results' => $bulletin,
            'overall_average' => round($overallAverage, 2),
        ], 'Bulletin generated successfully.');
    }
}

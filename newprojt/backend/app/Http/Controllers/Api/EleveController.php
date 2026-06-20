<?php

namespace App\Http\Controllers\Api;

use App\Models\Eleve;
use App\Http\Requests\StoreEleveRequest;
use App\Http\Requests\UpdateEleveRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class EleveController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $query = Eleve::query();

        if ($request->has('classe_id')) {
            $query->where('classe_id', $request->classe_id);
        }

        if ($request->has('niveau_id')) {
            $query->whereHas('classe', function ($q) use ($request) {
                $q->where('niveau_id', $request->niveau_id);
            });
        }

        if ($request->has('statut')) {
            $query->where('statut', $request->statut);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%$search%")
                  ->orWhere('prenom', 'like', "%$search%")
                  ->orWhere('code_massar', 'like', "%$search%");
            });
        }

        $eleves = $query->with(['classe.niveau'])->paginate(15);
        return $this->sendResponse($eleves, 'Eleves retrieved successfully.');
    }

    public function store(StoreEleveRequest $request): JsonResponse
    {
        $eleve = Eleve::create($request->validated());
        return $this->sendResponse($eleve, 'Eleve created successfully.');
    }

    public function show($id): JsonResponse
    {
        $eleve = Eleve::with(['classe.niveau', 'parents', 'notes', 'absences', 'paiements'])->find($id);

        if (is_null($eleve)) {
            return $this->sendError('Eleve not found.');
        }

        return $this->sendResponse($eleve, 'Eleve retrieved successfully.');
    }

    public function update(UpdateEleveRequest $request, Eleve $eleve): JsonResponse
    {
        $eleve->update($request->validated());
        return $this->sendResponse($eleve, 'Eleve updated successfully.');
    }

    public function destroy(Eleve $eleve): JsonResponse
    {
        $eleve->update(['statut' => 'inactif']);
        // If the user wants real soft delete, we'd use SoftDeletes trait, but they specified statut=inactif
        return $this->sendResponse([], 'Eleve marked as inactive.');
    }
}

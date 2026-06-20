<?php

namespace App\Http\Controllers\Api;

use App\Models\Niveau;
use App\Http\Requests\StoreNiveauRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class NiveauController extends BaseController
{
    public function index(): JsonResponse
    {
        $niveaux = Niveau::withCount('classes')->get();
        return $this->sendResponse($niveaux, 'Niveaux retrieved successfully.');
    }

    public function store(StoreNiveauRequest $request): JsonResponse
    {
        $niveau = Niveau::create($request->validated());
        return $this->sendResponse($niveau, 'Niveau created successfully.');
    }

    public function show($id): JsonResponse
    {
        $niveau = Niveau::with('classes')->find($id);
        if (is_null($niveau)) return $this->sendError('Niveau not found.');
        return $this->sendResponse($niveau, 'Niveau retrieved successfully.');
    }

    public function update(StoreNiveauRequest $request, Niveau $niveau): JsonResponse
    {
        $niveau->update($request->validated());
        return $this->sendResponse($niveau, 'Niveau updated successfully.');
    }

    public function destroy(Niveau $niveau): JsonResponse
    {
        $niveau->delete();
        return $this->sendResponse([], 'Niveau deleted successfully.');
    }
}

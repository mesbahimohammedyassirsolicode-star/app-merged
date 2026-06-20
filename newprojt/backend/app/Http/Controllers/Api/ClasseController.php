<?php

namespace App\Http\Controllers\Api;

use App\Models\Classe;
use App\Http\Requests\StoreClasseRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ClasseController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $query = Classe::withCount('eleves');
        
        if ($request->has('niveau_id')) {
            $query->where('niveau_id', $request->niveau_id);
        }

        $classes = $query->get();
        return $this->sendResponse($classes, 'Classes retrieved successfully.');
    }

    public function store(StoreClasseRequest $request): JsonResponse
    {
        $classe = Classe::create($request->validated());
        return $this->sendResponse($classe, 'Classe created successfully.');
    }

    public function show($id): JsonResponse
    {
        $classe = Classe::with('eleves')->find($id);
        if (is_null($classe)) return $this->sendError('Classe not found.');
        return $this->sendResponse($classe, 'Classe retrieved successfully.');
    }

    public function update(StoreClasseRequest $request, Classe $classe): JsonResponse
    {
        $classe->update($request->validated());
        return $this->sendResponse($classe, 'Classe updated successfully.');
    }

    public function destroy(Classe $classe): JsonResponse
    {
        $classe->delete();
        return $this->sendResponse([], 'Classe deleted successfully.');
    }
}

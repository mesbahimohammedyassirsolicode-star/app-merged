<?php

namespace App\Http\Controllers\Api;

use App\Models\Enseignant;
use App\Models\User;
use App\Http\Requests\StoreEnseignantRequest;
use App\Http\Requests\UpdateEnseignantRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\JsonResponse;

class EnseignantController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $query = Enseignant::query();

        if ($request->has('matiere')) {
            $query->where('matiere', $request->matiere);
        }

        if ($request->has('statut')) {
            $query->where('statut', $request->statut);
        }

        $enseignants = $query->paginate(15);
        return $this->sendResponse($enseignants, 'Enseignants retrieved successfully.');
    }

    public function store(StoreEnseignantRequest $request): JsonResponse
    {
        return DB::transaction(function () use ($request) {
            $user = User::create([
                'name' => $request->prenom . ' ' . $request->nom,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => 'enseignant',
            ]);

            $enseignant = Enseignant::create(array_merge($request->validated(), [
                'user_id' => $user->id,
            ]));

            return $this->sendResponse($enseignant, 'Enseignant and user account created successfully.');
        });
    }

    public function show($id): JsonResponse
    {
        $enseignant = Enseignant::with(['classes', 'emploiDuTemps'])->find($id);

        if (is_null($enseignant)) {
            return $this->sendError('Enseignant not found.');
        }

        return $this->sendResponse($enseignant, 'Enseignant retrieved successfully.');
    }

    public function update(UpdateEnseignantRequest $request, Enseignant $enseignant): JsonResponse
    {
        $enseignant->update($request->validated());
        
        if ($request->has('email') || $request->has('nom') || $request->has('prenom')) {
            $enseignant->user()->update([
                'email' => $request->email ?? $enseignant->user->email,
                'name' => ($request->prenom ?? $enseignant->prenom) . ' ' . ($request->nom ?? $enseignant->nom),
            ]);
        }

        return $this->sendResponse($enseignant, 'Enseignant updated successfully.');
    }

    public function destroy(Enseignant $enseignant): JsonResponse
    {
        $enseignant->update(['statut' => 'inactif']);
        $enseignant->user()->update(['active' => false]);
        return $this->sendResponse([], 'Enseignant marked as inactive.');
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Affectation;
use Illuminate\Http\Request;

class AffectationController extends Controller
{
    public function index(Request $request)
    {
        $query = Affectation::query()->with(['formateur.user', 'module', 'groupe', 'anneeScolaire']);
        $user = $request->user();

        if (in_array((string) $user?->role, ['teacher', 'formateur'], true)) {
            $formateurId = $user?->formateur?->id;
            if (! $formateurId) {
                return $this->success([]);
            }
            $query->where('formateur_id', $formateurId);
        }

        return $this->success($query->latest()->get());
    }

    public function show(Affectation $affectation)
    {
        return $this->success($affectation->load(['formateur.user', 'module', 'groupe', 'anneeScolaire']));
    }
}

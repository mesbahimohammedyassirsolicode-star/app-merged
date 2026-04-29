<?php

namespace App\Http\Controllers;

use App\Models\AnneeScolaire;
use App\Models\Filiere;
use App\Models\Groupe;
use App\Models\Module;
use App\Models\Niveau;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class AcademicStructureController extends Controller
{
    public function indexYears()
    {
        $items = AnneeScolaire::orderBy('year_start', 'desc')->get();

        return $this->success($items);
    }

    public function storeYear(Request $request)
    {
        $validated = $request->validate([
            'year_start' => 'required|digits:4|integer',
            'year_end' => 'required|digits:4|integer|gt:year_start',
            'label' => 'required|string|max:20',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
        ]);
        $year = AnneeScolaire::create($validated);

        return $this->created($year);
    }

    public function updateYear(Request $request, AnneeScolaire $year)
    {
        $validated = $request->validate([
            'year_start' => 'digits:4|integer',
            'year_end' => 'digits:4|integer|gt:year_start',
            'label' => 'string|max:20',
            'start_date' => 'date',
            'end_date' => 'date|after:start_date',
            'is_current' => 'boolean',
        ]);
        if (isset($validated['is_current']) && $validated['is_current']) {
            AnneeScolaire::where('id', '!=', $year->id)->update(['is_current' => false]);
        }
        $year->update($validated);

        return $this->success($year->fresh());
    }

    public function destroyYear(AnneeScolaire $year)
    {
        $year->delete();

        return response()->json(null, 204);
    }

    public function indexLevels()
    {
        $levels = Cache::remember('gims.niveaux', 3600, fn () => Niveau::all());

        return $this->success($levels);
    }

    public function indexFilieres(Request $request)
    {
        Filiere::query()->get()->each->ensureMinimumGroups(2);

        $query = Filiere::query()
            ->with([
                'modules' => fn ($moduleQuery) => $moduleQuery->orderBy('code'),
                'groups' => fn ($groupQuery) => $groupQuery->withCount('students'),
            ])
            ->orderBy('name');

        if ($request->has('niveau_id')) {
            $query->where('niveau_id', $request->niveau_id);
        }

        return $this->success($query->get());
    }

    public function storeFiliere(Request $request)
    {
        $validated = $request->validate([
            'niveau_id' => 'required|exists:niveaux,id',
            'label' => 'required|string|max:150',
            'code' => 'required|string|max:20|unique:filieres,code',
            'description' => 'nullable|string',
        ]);
        $validated['name'] = $validated['label'];
        $filiere = Filiere::create($validated);
        $filiere->ensureMinimumGroups(2);

        return $this->created($filiere->load('niveau'));
    }

    public function updateFiliere(Request $request, Filiere $filiere)
    {
        $validated = $request->validate([
            'niveau_id' => 'exists:niveaux,id',
            'label' => 'string|max:150',
            'code' => 'string|max:20|unique:filieres,code,'.$filiere->id,
            'description' => 'nullable|string',
        ]);
        if (isset($validated['label'])) {
            $validated['name'] = $validated['label'];
        }
        $filiere->update($validated);

        return $this->success($filiere->fresh('niveau'));
    }

    public function destroyFiliere(Filiere $filiere)
    {
        $filiere->delete();

        return response()->json(null, 204);
    }

    /**
     * Get modules and groups by filière and niveau (1A/2A).
     * GET /api/program?filiere_id=1&niveau=1A
     */
    public function getProgram(Request $request)
    {
        $validated = $request->validate([
            'filiere_id' => 'required|exists:filieres,id',
            'niveau' => 'required|string|max:50',
        ]);

        $filiereId = (int) $validated['filiere_id'];
        $niveauInput = Str::lower(trim($validated['niveau']));

        $niveauModel = Niveau::query()
            ->where('filiere_id', $filiereId)
            ->where(function ($query) use ($niveauInput) {
                $query->whereRaw('LOWER(name) = ?', [$niveauInput])
                    ->orWhereRaw('LOWER(label) = ?', [$niveauInput]);
            })
            ->first();

        if (! $niveauModel) {
            return $this->success([
                'modules' => [],
                'groups' => [],
            ]);
        }

        $modules = Module::query()
            ->where('niveau_id', $niveauModel->id)
            ->whereHas('niveau', fn ($query) => $query->where('filiere_id', $filiereId))
            ->orderBy('code')
            ->get(['id', 'niveau_id', 'code', 'name', 'label', 'semester']);

        $groups = Groupe::query()
            ->where('niveau_id', $niveauModel->id)
            ->whereHas('niveau', fn ($query) => $query->where('filiere_id', $filiereId))
            ->orderBy('label')
            ->get(['id', 'niveau_id', 'name', 'label', 'year_level']);

        return $this->success([
            'modules' => $modules,
            'groups' => $groups,
        ]);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\StagiaireModuleResource;
use App\Models\Filiere;
use App\Models\Note;
use App\Services\StagiaireService;
use Illuminate\Http\Request;

/**
 * Read-only stagiaire portal: modules and timetable strictly scoped to the authenticated student's filière.
 */
class StagiairePortalController extends BaseApiController
{
    public function __construct(
        private readonly StagiaireService $stagiaireService,
    ) {}

    /**
     * GET /api/v1/stagiaire/modules
     */
    public function modules(Request $request)
    {
        $user = $request->user();
        $user->loadMissing('stagiaire.groupe.niveau', 'stagiaire.groupes');
        $modules = $this->stagiaireService->getModulesForAuthenticatedUser($user);

        $meta = [];
        $stagiaire = $user->stagiaire;
        if ($stagiaire !== null) {
            $fid = $stagiaire->getFiliereIdForScope();
            if ($fid !== null) {
                $filiere = Filiere::query()->select(['id', 'code', 'label', 'name'])->find($fid);
                if ($filiere !== null) {
                    $meta['filiere'] = [
                        'id' => $filiere->id,
                        'code' => $filiere->code,
                        'label' => $filiere->label ?? $filiere->name,
                    ];
                }
            }
        }

        return $this->success(StagiaireModuleResource::collection($modules), $meta);
    }

    /**
     * GET /api/v1/stagiaire/timetable
     *
     * Query: week_start (optional, ISO date — Monday of the desired week).
     */
    public function timetable(Request $request)
    {
        $payload = $this->stagiaireService->getTimetablePayloadForAuthenticatedUser(
            $request->user(),
            $request->query('week_start')
        );

        return $this->success($payload);
    }

    /**
     * GET /api/v1/stagiaire/notes
     * Own notes only (linked to authenticated user's stagiaire profile).
     */
    public function notes(Request $request)
    {
        $user = $request->user();
        $user->loadMissing('stagiaire');
        $stagiaire = $user->stagiaire;

        if ($stagiaire === null) {
            return $this->success([]);
        }

        $rows = Note::query()
            ->where('stagiaire_id', $stagiaire->id)
            ->with(['evaluation.module:id,code,label'])
            ->latest()
            ->limit(30)
            ->get()
            ->map(fn (Note $n) => [
                'id' => (int) $n->id,
                'value' => $n->valeur,
                'evaluation' => $n->evaluation ? [
                    'id' => (int) $n->evaluation->id,
                    'label' => $n->evaluation->item_label ?? $n->evaluation->type,
                ] : null,
                'module' => $n->evaluation?->module ? [
                    'id' => (int) $n->evaluation->module->id,
                    'code' => $n->evaluation->module->code,
                    'label' => $n->evaluation->module->label,
                ] : null,
                'date' => $n->created_at?->toDateString(),
            ])
            ->values()
            ->all();

        return $this->success($rows);
    }
}

<?php

namespace App\Services;

use App\Models\Stagiaire;
use Illuminate\Support\Facades\DB;

/**
 * Keeps stagiaires.parent_id in sync when exactly one parent is linked via pivot (legacy readers).
 * When multiple parents share a stagiaire, parent_id is cleared.
 */
class ParentStagiaireDenormalizeService
{
    /**
     * @param  list<int>  $stagiaireIds
     */
    public function syncForStagiaireIds(array $stagiaireIds): void
    {
        $ids = array_unique(array_filter(array_map('intval', $stagiaireIds)));
        foreach ($ids as $id) {
            $this->syncSingle($id);
        }
    }

    public function syncSingle(int $stagiaireId): void
    {
        $parentIds = DB::table('parent_stagiaire')
            ->where('stagiaire_id', $stagiaireId)
            ->pluck('parent_id');

        if ($parentIds->count() === 1) {
            Stagiaire::query()->whereKey($stagiaireId)->update(['parent_id' => $parentIds->first()]);
        } else {
            Stagiaire::query()->whereKey($stagiaireId)->update(['parent_id' => null]);
        }
    }
}

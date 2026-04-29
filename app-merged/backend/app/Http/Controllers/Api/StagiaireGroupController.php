<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\StagiaireGroupOverviewResource;
use App\Services\GroupService;
use Illuminate\Http\Request;

/**
 * Read-only: authenticated stagiaire sees only their own groupe payload.
 */
class StagiaireGroupController extends BaseApiController
{
    public function __construct(
        private readonly GroupService $groupService,
    ) {}

    /**
     * GET /api/v1/stagiaire/group
     *
     * Query: week_start (optional, ISO date — Monday of the desired week).
     */
    public function show(Request $request)
    {
        $overview = $this->groupService->getOverviewForAuthenticatedStagiaire(
            $request->user(),
            $request->query('week_start')
        );

        return $this->success(StagiaireGroupOverviewResource::make($overview));
    }
}

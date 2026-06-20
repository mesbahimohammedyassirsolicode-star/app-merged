<?php

namespace App\Http\Controllers;

use App\Services\Copilot\CopilotOrchestrator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CopilotController extends Controller
{
    public function __construct(
        private CopilotOrchestrator $orchestrator
    ) {}

    /**
     * POST /api/v1/copilot/query — Main copilot query endpoint.
     */
    public function query(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'query' => 'required|string|min:2|max:1000',
            'session_id' => 'nullable|integer',
        ]);

        $result = $this->orchestrator->handle(
            $request->user(),
            $validated['query'],
            $validated['session_id'] ?? null
        );

        return $this->success($result);
    }

    /**
     * GET /api/v1/copilot/sessions — List user's chat sessions.
     */
    public function sessions(Request $request): JsonResponse
    {
        $sessions = $this->orchestrator->getSessions($request->user());
        return $this->success(['sessions' => $sessions]);
    }

    /**
     * GET /api/v1/copilot/sessions/{id}/messages — Get session messages.
     */
    public function messages(Request $request, int $id): JsonResponse
    {
        $messages = $this->orchestrator->getSessionMessages($request->user(), $id);
        return $this->success(['messages' => $messages]);
    }

    /**
     * DELETE /api/v1/copilot/sessions/{id} — Delete a session.
     */
    public function deleteSession(Request $request, int $id): JsonResponse
    {
        $this->orchestrator->deleteSession($request->user(), $id);
        return $this->success(['message' => 'Session supprimée.']);
    }

    /**
     * GET /api/v1/copilot/insights — Get auto-generated insights.
     */
    public function insights(Request $request): JsonResponse
    {
        $insights = $this->orchestrator->getInsightsSummary($request->user());
        return $this->success($insights);
    }

    private function success(mixed $data): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $data]);
    }
}

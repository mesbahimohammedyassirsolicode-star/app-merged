<?php

namespace App\Http\Controllers;

use App\Models\Feedback;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class FeedbackController extends Controller
{
    public function index(Request $request)
    {
        $perPage = min((int) $request->get('per_page', 15), 50);
        $paginator = Feedback::latest()->paginate($perPage);

        return $this->success($paginator->items(), [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
        ]);
    }

    /**
     * Store anonymous feedback. No user_id, no IP stored. Optional one-time submission_token.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'category' => 'required|in:pedagogie,infrastructure,administration,autre',
            'content' => 'required|string|min:10|max:5000',
            'submission_token' => 'nullable|string|size:64',
        ]);
        $token = $validated['submission_token'] ?? null;
        if ($token && Feedback::where('submission_token', $token)->exists()) {
            return $this->error('Ce formulaire a déjà été soumis.', 422);
        }
        unset($validated['submission_token']);
        $validated['submission_token'] = $token ?? Str::random(64);
        Feedback::create($validated);

        return $this->created(['message' => 'Merci. Votre avis a été enregistré de manière anonyme.']);
    }
}

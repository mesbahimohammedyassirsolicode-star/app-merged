<?php

namespace App\Http\Controllers;

use App\Models\Stagiaire;
use App\Services\PDFService;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    protected $pdfService;

    public function __construct(PDFService $pdfService)
    {
        $this->pdfService = $pdfService;
    }

    /**
     * Generate student bulletin.
     */
    public function studentReport(Request $request, int $id)
    {
        $student = Stagiaire::with(['user', 'filiere', 'groupe', 'notes.module', 'absences.seance.module'])
            ->findOrFail($id);

        // Security: Ensure only authorized users can view reports
        if ($request->user()->role === 'student' || $request->user()->role === 'stagiaire') {
            if ((int) ($request->user()->stagiaire?->id ?? 0) !== (int) $id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        } elseif ($request->user()->role === 'parent') {
            $isLinkedChild = $request->user()->parent?->children()->where('stagiaires.id', $id)->exists() ?? false;
            if (! $isLinkedChild) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        $data = [
            'student' => $student,
            'notes' => $student->notes,
            'absences' => $student->absences,
            'date' => now()->format('d/m/Y'),
        ];

        return $this->pdfService->generate(
            'pdf.bulletin',
            $data,
            'bulletin_'.$student->user->name.'.pdf'
        );
    }
}

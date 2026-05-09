<?php

namespace App\Http\Controllers;

use App\Services\ObjectScopeService;
use App\Services\PDFService;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function __construct(
        protected PDFService $pdfService,
        protected ObjectScopeService $objectScopeService
    ) {}

    /**
     * Generate student bulletin.
     */
    public function studentReport(Request $request, int $id)
    {
        $student = $this->objectScopeService->findScopedStagiaireOrFail($request->user(), $id);
        $this->authorize('viewReport', $student);

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

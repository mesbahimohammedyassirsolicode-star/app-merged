<?php

namespace App\Services;

use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Response;

class PDFService
{
    /**
     * Generate a PDF from a view.
     *
     * @return Response
     */
    public function generate(string $view, array $data, ?string $filename = null)
    {
        $pdf = Pdf::loadView($view, $data);

        if ($filename) {
            return $pdf->download($filename);
        }

        return $pdf->stream();
    }
}

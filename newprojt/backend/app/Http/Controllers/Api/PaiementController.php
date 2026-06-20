<?php

namespace App\Http\Controllers\Api;

use App\Models\Paiement;
use App\Models\Eleve;
use App\Http\Requests\StorePaiementRequest;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class PaiementController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $query = Paiement::with('eleve.classe');

        if ($request->has('mois')) {
            $query->where('mois', $request->mois);
        }

        if ($request->has('statut')) {
            $query->where('statut', $request->statut);
        }

        if ($request->has('classe_id')) {
            $query->whereHas('eleve', function ($q) use ($request) {
                $q->where('classe_id', $request->classe_id);
            });
        }

        $paiements = $query->paginate(15);
        return $this->sendResponse($paiements, 'Paiements retrieved successfully.');
    }

    public function getImpayes(): JsonResponse
    {
        $impayes = Paiement::with('eleve.classe')
            ->where('statut', 'impaye')
            ->get()
            ->map(function ($paiement) {
                // Mock overdue logic: assuming due date is 10th of the month
                // Parse month (e.g., "May 2026")
                try {
                    $dueDate = Carbon::parse("10 " . $paiement->mois);
                } catch (\Exception $e) {
                    $dueDate = $paiement->created_at;
                }
                
                $paiement->days_overdue = $dueDate->isPast() ? $dueDate->diffInDays(Carbon::now()) : 0;
                return $paiement;
            });

        return $this->sendResponse($impayes, 'Unpaid payments retrieved successfully.');
    }

    public function store(StorePaiementRequest $request): JsonResponse
    {
        $paiement = Paiement::create($request->validated());
        return $this->sendResponse($paiement, 'Payment registered successfully.');
    }

    public function update(StorePaiementRequest $request, Paiement $paiement): JsonResponse
    {
        $paiement->update($request->validated());
        return $this->sendResponse($paiement, 'Payment updated successfully.');
    }

    public function getRecu($id): JsonResponse
    {
        $paiement = Paiement::with(['eleve.classe.niveau', 'school'])->find($id);
        
        if (is_null($paiement)) {
            return $this->sendError('Payment not found.');
        }

        // Generate mock receipt data
        $receiptData = [
            'receipt_number' => 'REC-' . str_pad($paiement->id, 6, '0', STR_PAD_LEFT),
            'date' => $paiement->date_paiement,
            'student_name' => $paiement->eleve->prenom . ' ' . $paiement->eleve->nom,
            'class' => $paiement->eleve->classe->name,
            'amount' => $paiement->montant,
            'period' => $paiement->mois,
            'payment_mode' => $paiement->mode_paiement,
            'school_name' => $paiement->school->name ?? 'EduFlow School',
        ];

        return $this->sendResponse($receiptData, 'Receipt data generated successfully.');
    }
}

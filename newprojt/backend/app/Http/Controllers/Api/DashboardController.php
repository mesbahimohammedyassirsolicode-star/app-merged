<?php

namespace App\Http\Controllers\Api;

use App\Models\Eleve;
use App\Models\Enseignant;
use App\Models\Classe;
use App\Models\Niveau;
use App\Models\Absence;
use App\Models\Paiement;
use App\Models\NotificationModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class DashboardController extends BaseController
{
    public function getStats(): JsonResponse
    {
        $today = Carbon::today()->toDateString();
        $startOfMonth = Carbon::now()->startOfMonth()->toDateString();

        $totalEleves = Eleve::count();
        $absencesToday = Absence::where('date', $today)->distinct('eleve_id')->count();
        $presenceTodayPct = $totalEleves > 0 ? (($totalEleves - $absencesToday) / $totalEleves) * 100 : 0;

        $revenusMois = Paiement::where('date_paiement', '>=', $startOfMonth)
            ->where('statut', 'paye')
            ->sum('montant');

        $alertesCount = NotificationModel::whereNull('read_at')->count();
        $totalEnseignants = Enseignant::count();
        $classesActives = Classe::where('statut', 'actif')->count();
        
        $impayesCount = Paiement::where('statut', 'impaye')->count();
        $nouveauxInscrits = Eleve::where('created_at', '>=', Carbon::now()->subDays(30))->count();

        return $this->sendResponse([
            'total_eleves' => $totalEleves,
            'presence_today' => round($presenceTodayPct, 2),
            'revenus_mois' => $revenusMois,
            'alertes_count' => $alertesCount,
            'total_enseignants' => $totalEnseignants,
            'classes_actives' => $classesActives,
            'impayes_count' => $impayesCount,
            'nouveaux_inscrits' => $nouveauxInscrits,
        ], 'Dashboard stats retrieved successfully.');
    }

    public function getPresenceTrend(): JsonResponse
    {
        $last30Days = [];
        $totalEleves = Eleve::count();

        for ($i = 29; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i)->toDateString();
            $absences = Absence::where('date', $date)->distinct('eleve_id')->count();
            $percentage = $totalEleves > 0 ? (($totalEleves - $absences) / $totalEleves) * 100 : 0;
            
            $last30Days[] = [
                'date' => $date,
                'percentage' => round($percentage, 2)
            ];
        }

        return $this->sendResponse($last30Days, 'Presence trend retrieved successfully.');
    }

    public function getElevesParNiveau(): JsonResponse
    {
        $stats = Niveau::withCount('eleves')->get()->map(function ($niveau) {
            return [
                'niveau' => $niveau->nom,
                'count' => $niveau->eleves_count
            ];
        });

        return $this->sendResponse($stats, 'Eleves par niveau retrieved successfully.');
    }

    public function getAlertesRecentes(): JsonResponse
    {
        $alertes = NotificationModel::orderBy('created_at', 'desc')->take(5)->get();
        return $this->sendResponse($alertes, 'Recent alerts retrieved successfully.');
    }
}

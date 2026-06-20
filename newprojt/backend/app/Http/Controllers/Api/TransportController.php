<?php

namespace App\Http\Controllers\Api;

use App\Models\Bus;
use App\Models\Eleve;
use App\Models\IncidentTransport;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TransportController extends BaseController
{
    public function index(): JsonResponse
    {
        $buses = Bus::withCount('eleves')->get();
        return $this->sendResponse($buses, 'Buses retrieved successfully.');
    }

    public function show($id): JsonResponse
    {
        $bus = Bus::with('eleves.classe')->find($id);
        if (is_null($bus)) return $this->sendError('Bus not found.');
        return $this->sendResponse($bus, 'Bus retrieved successfully.');
    }

    public function store(Request $request): JsonResponse
    {
        $bus = Bus::create($request->all());
        return $this->sendResponse($bus, 'Bus created successfully.');
    }

    public function update(Request $request, Bus $bus): JsonResponse
    {
        $bus->update($request->all());
        return $this->sendResponse($bus, 'Bus updated successfully.');
    }

    public function getTransportedEleves(): JsonResponse
    {
        $eleves = Eleve::whereHas('bus')->with('bus', 'classe')->get();
        return $this->sendResponse($eleves, 'Transported students retrieved successfully.');
    }

    public function getIncidents(): JsonResponse
    {
        $incidents = IncidentTransport::with('bus')->orderBy('date', 'desc')->get();
        return $this->sendResponse($incidents, 'Incidents retrieved successfully.');
    }

    public function storeIncident(Request $request): JsonResponse
    {
        $incident = IncidentTransport::create($request->all());
        return $this->sendResponse($incident, 'Incident reported successfully.');
    }
}

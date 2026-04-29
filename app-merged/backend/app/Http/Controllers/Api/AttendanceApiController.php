<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\AttendanceReportRequest;
use App\Http\Requests\DetectAttendanceSessionRequest;
use App\Http\Requests\IndexAttendanceRequest;
use App\Http\Requests\MarkAttendanceSessionRequest;
use App\Http\Requests\UpdateAttendanceApiRequest;
use App\Http\Resources\AttendanceResource;
use App\Models\Attendance;
use App\Services\AttendanceService;
use Illuminate\Http\Request;

class AttendanceApiController extends BaseApiController
{
    public function __construct(private readonly AttendanceService $attendanceService) {}

    /**
     * GET /attendance — list rows for module + groupe with optional filters.
     */
    public function index(IndexAttendanceRequest $request)
    {
        $this->authorize('viewAny', Attendance::class);

        $validated = $request->validated();
        $rows = $this->attendanceService->listForStaff($request->user(), $validated);

        return $this->success(AttendanceResource::collection($rows), ['count' => $rows->count()]);
    }

    /**
     * POST /attendance — batch mark / update session (same payload as legacy /attendance/sessions).
     */
    public function store(MarkAttendanceSessionRequest $request)
    {
        return $this->markSession($request);
    }

    public function markSession(MarkAttendanceSessionRequest $request)
    {
        $validated = $request->validated();

        $this->authorize('markSession', [Attendance::class, (int) $validated['module_id'], (int) $validated['group_id']]);

        $result = $this->attendanceService->bulkMarkSession($request->user(), $validated);

        return $this->success($result);
    }

    /**
     * Legacy + modern route: existing marks for one session (aligned on academic_year).
     */
    public function detect(DetectAttendanceSessionRequest $request)
    {
        $validated = $request->validated();

        $this->authorize('markSession', [Attendance::class, (int) $validated['module_id'], (int) $validated['group_id']]);

        $records = $this->attendanceService->detectSessionRecords($request->user(), $validated);

        return $this->success(AttendanceResource::collection($records), ['count' => $records->count()]);
    }

    public function update(UpdateAttendanceApiRequest $request, int $id)
    {
        $attendance = Attendance::query()->findOrFail($id);
        $this->authorize('update', $attendance);

        $validated = $request->validated();

        $updated = $this->attendanceService->correctAttendance($attendance, $validated);

        return $this->success(new AttendanceResource($updated));
    }

    public function me(Request $request)
    {
        $studentId = (int) $request->user()->id;
        $this->authorize('viewSelf', [Attendance::class, $studentId]);

        $filters = $request->validate([
            'group_id' => ['nullable', 'integer', 'exists:groupes,id'],
            'module_id' => ['nullable', 'integer', 'exists:modules,id'],
            'status' => ['nullable', 'in:present,absent,late'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
        ]);

        $data = $this->attendanceService->getStudentAttendance($studentId, $filters);

        return $this->success(AttendanceResource::collection($data), ['count' => $data->count()]);
    }

    public function child(Request $request, int $studentId)
    {
        $this->authorize('viewChild', [Attendance::class, $studentId]);

        $filters = $request->validate([
            'group_id' => ['nullable', 'integer', 'exists:groupes,id'],
            'module_id' => ['nullable', 'integer', 'exists:modules,id'],
            'status' => ['nullable', 'in:present,absent,late'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
        ]);

        $data = $this->attendanceService->getStudentAttendance($studentId, $filters);

        return $this->success(AttendanceResource::collection($data), ['count' => $data->count()]);
    }

    /**
     * GET /attendance/report — daily / weekly aggregates (admin: full; formateur: scoped).
     */
    public function report(AttendanceReportRequest $request)
    {
        $this->authorize('viewReport', Attendance::class);

        $validated = $request->validated();
        $summary = $this->attendanceService->attendanceReportSummary($request->user(), $validated);

        return $this->success($summary);
    }
}

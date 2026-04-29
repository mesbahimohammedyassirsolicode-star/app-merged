<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\Module;
use App\Models\Stagiaire;
use App\Models\StudentParent;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AttendanceService
{
    public function teacherCanManageModuleGroup(User $teacherUser, int $moduleId, int $groupId): bool
    {
        $teacherId = $teacherUser->formateur?->id;
        $teacherFiliereId = $teacherUser->formateur?->filiere_id;
        if (! $teacherId) {
            return false;
        }

        $uid = (int) $teacherUser->id;

        $moduleCurriculumLink = DB::table('module_groupe')
            ->where('module_id', $moduleId)
            ->where('groupe_id', $groupId)
            ->exists();

        $adminModalPair = DB::table('formateur_module_group')
            ->where('user_id', $uid)
            ->where('module_id', $moduleId)
            ->where('groupe_id', $groupId)
            ->exists();

        $moduleOrAssignmentLink = $moduleCurriculumLink || $adminModalPair;

        $assignedViaTeacherModule = DB::table('teacher_module')
            ->where('teacher_id', $teacherId)
            ->where('module_id', $moduleId)
            ->exists();
        $hasFormateurModuleRow = DB::table('formateur_module')
            ->where('user_id', $uid)
            ->where('module_id', $moduleId)
            ->exists();

        $hasScopedModuleGroupRows = DB::table('formateur_module_group')
            ->where('user_id', $uid)
            ->where('module_id', $moduleId)
            ->exists();

        $scopedAllowsThisGroup = ! $hasScopedModuleGroupRows
            || DB::table('formateur_module_group')
                ->where('user_id', $uid)
                ->where('module_id', $moduleId)
                ->where('groupe_id', $groupId)
                ->exists();

        $assignedViaUserModal = $hasFormateurModuleRow && $scopedAllowsThisGroup;

        $hasNewAssignments = $moduleOrAssignmentLink
            && ($assignedViaTeacherModule || $assignedViaUserModal);

        $groupRow = DB::table('groupes')->where('id', $groupId)->first();
        $groupFiliereId = $groupRow->filiere_id ?? null;
        if ($groupFiliereId === null && $groupRow && isset($groupRow->niveau_id)) {
            $groupFiliereId = DB::table('niveaux')->where('id', $groupRow->niveau_id)->value('filiere_id');
        }
        $moduleFiliereId = DB::table('modules')
            ->join('niveaux', 'niveaux.id', '=', 'modules.niveau_id')
            ->where('modules.id', $moduleId)
            ->value('niveaux.filiere_id');

        $filiereConsistent = true;
        if ($moduleFiliereId !== null && $groupFiliereId !== null
            && (int) $moduleFiliereId !== (int) $groupFiliereId) {
            $filiereConsistent = false;
        }
        if ($teacherFiliereId !== null) {
            $tf = (int) $teacherFiliereId;
            $mf = $moduleFiliereId !== null ? (int) $moduleFiliereId : null;
            $gf = $groupFiliereId !== null ? (int) $groupFiliereId : null;
            if ($mf === null || $gf === null || $mf !== $tf || $gf !== $tf) {
                $filiereConsistent = false;
            }
        }

        $allowed = $hasNewAssignments && $filiereConsistent;

        return $allowed;
    }

    public function isParentLinkedToStudent(User $parentUser, int $studentUserId): bool
    {
        $parent = StudentParent::query()
            ->where('user_id', $parentUser->id)
            ->first();

        if (! $parent) {
            return false;
        }

        return Stagiaire::query()
            ->where('user_id', $studentUserId)
            ->whereHas('parents', fn ($q) => $q->where('parents.id', $parent->id))
            ->exists();
    }

    public function bulkMarkSession(User $actor, array $payload): array
    {
        $groupId = (int) $payload['group_id'];
        $moduleId = (int) $payload['module_id'];

        $this->assertModuleGroupMarkingAllowed($actor, $moduleId, $groupId);

        $created = 0;
        $updated = 0;

        $filiereId = $this->resolveFiliereIdForModuleGroup($moduleId, $groupId);
        $formateurRecordId = $actor->formateur?->id;

        DB::transaction(function () use ($actor, $payload, $groupId, $moduleId, $filiereId, $formateurRecordId, &$created, &$updated): void {
            foreach ($payload['attendances'] as $row) {
                $studentId = (int) $row['student_id'];
                $this->assertStudentInGroup($studentId, $groupId);
                $this->assertLateMinutesConsistency($row);

                $stagiaire = Stagiaire::query()->where('user_id', $studentId)->first();

                // Match existing rows by calendar date — firstOrNew() missed rows when DB date casting differed from the payload string.
                $attendance = Attendance::query()
                    ->where('student_id', $studentId)
                    ->where('module_id', $moduleId)
                    ->where('group_id', $groupId)
                    ->whereDate('date', $payload['date'])
                    ->where('academic_year', $payload['academic_year'])
                    ->first();

                if ($attendance) {
                    $updated++;
                } else {
                    $created++;
                    $attendance = new Attendance([
                        'student_id' => $studentId,
                        'module_id' => $moduleId,
                        'group_id' => $groupId,
                        'date' => $payload['date'],
                        'academic_year' => $payload['academic_year'],
                        'created_by' => $actor->id,
                    ]);
                }

                $attendance->teacher_id = $this->resolveTeacherId($actor, $payload);
                $attendance->stagiaire_id = $stagiaire?->id;
                $attendance->filiere_id = $filiereId;
                $attendance->formateur_id = $formateurRecordId;
                $attendance->status = $row['status'];
                $attendance->minutes_late = $row['minutes_late'] ?? null;
                $attendance->note = $row['note'] ?? null;
                $attendance->save();
            }
        });

        return [
            'message' => 'Attendance session saved successfully.',
            'summary' => [
                'created' => $created,
                'updated' => $updated,
                'total' => $created + $updated,
            ],
        ];
    }

    public function correctAttendance(Attendance $attendance, array $payload): Attendance
    {
        $status = $payload['status'] ?? $attendance->status;
        if ($status === 'retard') {
            $status = 'late';
        }

        $attendance->fill([
            'status' => $status,
            'minutes_late' => $payload['minutes_late'] ?? null,
            'note' => $payload['note'] ?? $attendance->note,
        ]);
        $attendance->save();

        return $attendance->fresh(['student', 'teacher', 'module', 'group', 'stagiaire', 'filiere', 'formateur']);
    }

    public function getStudentAttendance(int $studentUserId, array $filters = [])
    {
        return Attendance::query()
            ->with(['student', 'teacher', 'module', 'group', 'stagiaire', 'filiere'])
            ->where('student_id', $studentUserId)
            ->when(isset($filters['group_id']), fn (Builder $q) => $q->where('group_id', (int) $filters['group_id']))
            ->when(isset($filters['module_id']), fn (Builder $q) => $q->where('module_id', (int) $filters['module_id']))
            ->when(isset($filters['status']), fn (Builder $q) => $q->where('status', $filters['status']))
            ->when(isset($filters['date_from']), fn (Builder $q) => $q->whereDate('date', '>=', $filters['date_from']))
            ->when(isset($filters['date_to']), fn (Builder $q) => $q->whereDate('date', '<=', $filters['date_to']))
            ->orderByDesc('date')
            ->get();
    }

    public function adminReport(array $filters = [])
    {
        return Attendance::query()
            ->with(['student', 'teacher', 'module.niveau.filiere', 'group.niveau.filiere', 'stagiaire', 'filiere'])
            ->when(isset($filters['filiere_id']), function (Builder $q) use ($filters): void {
                $filiereId = (int) $filters['filiere_id'];
                $q->where(function (Builder $inner) use ($filiereId): void {
                    $inner->where('filiere_id', $filiereId)
                        ->orWhere(function (Builder $legacy) use ($filiereId): void {
                            $legacy->whereNull('filiere_id')
                                ->whereHas('module.niveau', fn (Builder $mq) => $mq->where('filiere_id', $filiereId))
                                ->whereHas('group.niveau', fn (Builder $gq) => $gq->where('filiere_id', $filiereId));
                        });
                });
            })
            ->when(isset($filters['group_id']), fn (Builder $q) => $q->where('group_id', (int) $filters['group_id']))
            ->when(isset($filters['module_id']), fn (Builder $q) => $q->where('module_id', (int) $filters['module_id']))
            ->when(isset($filters['status']), fn (Builder $q) => $q->where('status', $filters['status']))
            ->when(isset($filters['date_from']), fn (Builder $q) => $q->whereDate('date', '>=', $filters['date_from']))
            ->when(isset($filters['date_to']), fn (Builder $q) => $q->whereDate('date', '<=', $filters['date_to']))
            ->orderByDesc('date')
            ->get();
    }

    public function resolveAcademicYearFromDate(string $date): string
    {
        $d = Carbon::parse($date);
        $year = (int) $d->format('Y');
        $month = (int) $d->format('n');
        $start = $month >= 9 ? $year : $year - 1;

        return $start.'-'.($start + 1);
    }

    /**
     * Existing marks for one session (module + group + calendar day + academic year).
     *
     * @return Collection<int, Attendance>
     */
    public function detectSessionRecords(User $actor, array $validated): Collection
    {
        $moduleId = (int) $validated['module_id'];
        $groupId = (int) $validated['group_id'];
        $this->assertModuleGroupMarkingAllowed($actor, $moduleId, $groupId);

        $academicYear = $validated['academic_year'] ?? $this->resolveAcademicYearFromDate($validated['date']);

        return Attendance::query()
            ->with(['student', 'module', 'group', 'stagiaire', 'filiere', 'formateur'])
            ->where('group_id', $groupId)
            ->where('module_id', $moduleId)
            ->whereDate('date', $validated['date'])
            ->where('academic_year', $academicYear)
            ->orderBy('student_id')
            ->get();
    }

    /**
     * Filtered list for staff dashboards (same scope rules as marking).
     *
     * @return Collection<int, Attendance>
     */
    public function listForStaff(User $actor, array $filters): Collection
    {
        $moduleId = (int) $filters['module_id'];
        $groupId = (int) $filters['group_id'];
        $this->assertModuleGroupMarkingAllowed($actor, $moduleId, $groupId);

        return Attendance::query()
            ->with(['student', 'teacher', 'module', 'group', 'stagiaire', 'filiere', 'formateur'])
            ->where('module_id', $moduleId)
            ->where('group_id', $groupId)
            ->when(isset($filters['date']), fn (Builder $q) => $q->whereDate('date', $filters['date']))
            ->when(isset($filters['date_from']), fn (Builder $q) => $q->whereDate('date', '>=', $filters['date_from']))
            ->when(isset($filters['date_to']), fn (Builder $q) => $q->whereDate('date', '<=', $filters['date_to']))
            ->when(isset($filters['status']), fn (Builder $q) => $q->where('status', $filters['status']))
            ->when(isset($filters['academic_year']), fn (Builder $q) => $q->where('academic_year', $filters['academic_year']))
            ->when(isset($filters['filiere_id']), fn (Builder $q) => $q->where('filiere_id', (int) $filters['filiere_id']))
            ->orderBy('student_id')
            ->get();
    }

    /**
     * Aggregated counts for daily or weekly windows (scoped for formateurs).
     *
     * @return array{period: string, date_from: string, date_to: string, summary: array{total: int, present: int, absent: int, late: int}}
     */
    public function attendanceReportSummary(User $actor, array $filters): array
    {
        $period = $filters['period'] ?? 'daily';
        $anchorDate = Carbon::parse($filters['date'] ?? now());

        if ($period === 'weekly') {
            $start = $anchorDate->copy()->startOfWeek(Carbon::MONDAY);
            $end = $anchorDate->copy()->endOfWeek(Carbon::SUNDAY);
        } else {
            $start = $anchorDate->copy()->startOfDay();
            $end = $anchorDate->copy()->endOfDay();
        }

        $query = Attendance::query()
            ->whereBetween('date', [$start->toDateString(), $end->toDateString()])
            ->when(isset($filters['filiere_id']), fn (Builder $q) => $q->where('filiere_id', (int) $filters['filiere_id']))
            ->when(isset($filters['group_id']), fn (Builder $q) => $q->where('group_id', (int) $filters['group_id']))
            ->when(isset($filters['module_id']), fn (Builder $q) => $q->where('module_id', (int) $filters['module_id']));

        if (! in_array((string) $actor->role, ['admin', 'directeur', 'secretariat'], true)) {
            $fid = $actor->formateur?->filiere_id;
            if ($fid) {
                $query->where(function (Builder $q) use ($fid): void {
                    $q->where('filiere_id', $fid)
                        ->orWhere(function (Builder $inner) use ($fid): void {
                            $inner->whereNull('filiere_id')
                                ->whereHas('module.niveau', fn (Builder $mq) => $mq->where('filiere_id', $fid));
                        });
                });
            } else {
                $query->where(function (Builder $w) use ($actor): void {
                    $w->where('teacher_id', $actor->id)->orWhere('created_by', $actor->id);
                });
            }
        }

        $rows = $query->get(['status']);
        $present = $rows->where('status', 'present')->count();
        $absent = $rows->where('status', 'absent')->count();
        $late = $rows->whereIn('status', ['late', 'retard'])->count();

        return [
            'period' => $period,
            'date_from' => $start->toDateString(),
            'date_to' => $end->toDateString(),
            'summary' => [
                'total' => $rows->count(),
                'present' => $present,
                'absent' => $absent,
                'late' => $late,
            ],
        ];
    }

    private function resolveFiliereIdForModuleGroup(int $moduleId, int $groupId): ?int
    {
        $module = Module::query()->with('niveau')->find($moduleId);
        if ($module?->filiere_id) {
            return (int) $module->filiere_id;
        }
        if ($module?->niveau?->filiere_id) {
            return (int) $module->niveau->filiere_id;
        }

        $group = DB::table('groupes')->where('id', $groupId)->first();
        if ($group && $group->filiere_id) {
            return (int) $group->filiere_id;
        }
        if ($group && isset($group->niveau_id)) {
            $fid = DB::table('niveaux')->where('id', $group->niveau_id)->value('filiere_id');

            return $fid !== null ? (int) $fid : null;
        }

        return null;
    }

    private function assertStudentInGroup(int $studentUserId, int $groupId): void
    {
        $stagiaire = Stagiaire::query()
            ->where('user_id', $studentUserId)
            ->first();

        if (! $stagiaire) {
            throw ValidationException::withMessages([
                'attendances' => ['Student profile not found.'],
            ]);
        }

        $isInGroup = ((int) ($stagiaire->groupe_id ?? 0) === $groupId)
            || $stagiaire->groupes()->where('groupes.id', $groupId)->exists();

        if (! $isInGroup) {
            throw ValidationException::withMessages([
                'attendances' => ["Student {$studentUserId} does not belong to group {$groupId}."],
            ]);
        }
    }

    /**
     * Policy allows marking when the teacher is assigned (incl. formateur_module_group without module_groupe).
     * This check must stay aligned with {@see AttendancePolicy::markSession} / {@see self::teacherCanManageModuleGroup}.
     */
    private function assertModuleGroupMarkingAllowed(User $actor, int $moduleId, int $groupId): void
    {
        $module = Module::query()->find($moduleId);

        if (! $module) {
            throw ValidationException::withMessages([
                'module_id' => ['Selected module does not exist.'],
            ]);
        }

        $group = DB::table('groupes')->where('id', $groupId)->first();
        if (! $group) {
            throw ValidationException::withMessages([
                'group_id' => ['Selected group does not exist.'],
            ]);
        }

        $groupNiveau = DB::table('niveaux')->where('id', $group->niveau_id)->first();
        $moduleNiveau = DB::table('niveaux')->where('id', $module->niveau_id)->first();
        $canCompareFiliere = isset($moduleNiveau?->filiere_id, $groupNiveau?->filiere_id);
        $sameFiliere = ! $canCompareFiliere
            ? true
            : (int) $moduleNiveau->filiere_id === (int) $groupNiveau->filiere_id;

        if (! $sameFiliere) {
            throw ValidationException::withMessages([
                'module_id' => ['The selected module does not match the group programme.'],
            ]);
        }

        if (in_array((string) $actor->role, ['admin', 'directeur', 'secretariat'], true)) {
            return;
        }

        if (! $this->teacherCanManageModuleGroup($actor, $moduleId, $groupId)) {
            throw ValidationException::withMessages([
                'module_id' => ['The selected module is not valid for the provided group context.'],
            ]);
        }
    }

    private function resolveTeacherId(User $actor, array $payload): int
    {
        if ($actor->role === 'admin' && isset($payload['teacher_id'])) {
            return (int) $payload['teacher_id'];
        }

        return (int) $actor->id;
    }

    private function assertLateMinutesConsistency(array $row): void
    {
        if (($row['status'] ?? null) !== 'late') {
            return;
        }

        if (! isset($row['minutes_late']) || (int) $row['minutes_late'] < 1) {
            throw ValidationException::withMessages([
                'attendances' => ['minutes_late is required and must be greater than 0 when status is late.'],
            ]);
        }
    }
}

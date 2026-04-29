<?php

namespace App\Policies;

use App\Models\Attendance;
use App\Models\User;
use App\Services\AttendanceService;

class AttendancePolicy
{
    public function __construct(private readonly AttendanceService $attendanceService) {}

    public function before(User $user, string $ability): ?bool
    {
        if ($this->isAdmin($user)) {
            return true;
        }

        return null;
    }

    public function markSession(User $user, int $moduleId, int $groupId): bool
    {
        return $this->isTeacher($user)
            && $this->attendanceService->teacherCanManageModuleGroup($user, $moduleId, $groupId);
    }

    public function viewAny(User $user): bool
    {
        // Admin/directeur/secretariat are handled by before(); teachers need scoped access.
        return $this->isTeacher($user);
    }

    public function update(User $user, Attendance $attendance): bool
    {
        if (! $this->isTeacher($user)) {
            return false;
        }

        return $this->attendanceService->teacherCanManageModuleGroup(
            $user,
            (int) $attendance->module_id,
            (int) $attendance->group_id
        );
    }

    public function view(User $user, Attendance $attendance): bool
    {
        if ($this->isTeacher($user)) {
            return $this->attendanceService->teacherCanManageModuleGroup(
                $user,
                (int) $attendance->module_id,
                (int) $attendance->group_id
            );
        }

        if ($this->isStudent($user)) {
            return (int) $attendance->student_id === (int) $user->id;
        }

        if ($this->isParent($user)) {
            return $this->attendanceService->isParentLinkedToStudent($user, (int) $attendance->student_id);
        }

        return false;
    }

    public function viewSelf(User $user, int $studentId): bool
    {
        return $this->isStudent($user) && (int) $user->id === $studentId;
    }

    public function viewChild(User $user, int $studentId): bool
    {
        return $this->isParent($user) && $this->attendanceService->isParentLinkedToStudent($user, $studentId);
    }

    public function viewReport(User $user): bool
    {
        return $this->isAdmin($user) || $this->isTeacher($user);
    }

    private function isAdmin(User $user): bool
    {
        return in_array((string) $user->role, ['admin', 'directeur', 'secretariat'], true);
    }

    private function isTeacher(User $user): bool
    {
        return in_array((string) $user->role, ['teacher', 'formateur'], true);
    }

    private function isStudent(User $user): bool
    {
        return in_array((string) $user->role, ['student', 'stagiaire'], true);
    }

    private function isParent(User $user): bool
    {
        return $user->role === 'parent';
    }
}

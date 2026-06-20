import api from '../lib/axios';

export interface DashboardResponse<T = unknown> {
    role: 'admin' | 'directeur' | 'secretariat' | 'teacher' | 'formateur' | 'student' | 'stagiaire' | 'parent';
    data: T;
}

export interface AdminDashboardData {
    stats: {
        total_students: number;
        total_teachers: number;
        total_filieres: number;
        total_groupes: number;
    };
    charts: {
        students_per_filiere: { name: string; value: number }[];
    };
    attendance: {
        absence_rate_by_group_module: {
            group_id: number;
            group_label: string;
            module_id: number;
            module_code: string;
            module_label: string;
            total_count: number;
            absent_count: number;
            absence_rate_percent: number;
            is_risk: boolean;
        }[];
        monthly_summary: {
            month: string;
            total_count: number;
            present_count: number;
            absent_count: number;
            late_count: number;
            attendance_rate_percent: number;
            absence_rate_percent: number;
        }[];
    };
    quick_actions: { label: string; path: string }[];
}

export interface TeacherDashboardData {
    todays_sessions: {
        id: number;
        module: string;
        groupe: string;
        filiere: string;
        start_time: string;
        end_time: string;
    }[];
    assigned_modules: {
        module_id: number;
        module_code: string;
        module_label: string;
        groupes: {
            id: number;
            label: string;
            filiere: { id: number; code: string; label: string } | null;
        }[];
    }[];
    teaching_scope?: {
        filiere: { id: number; code: string; label: string } | null;
        modules_count: number;
        groups_count: number;
        stagiaires_count: number;
        stagiaires: {
            id: number;
            user_id: number;
            name: string;
            groupe_id: number;
        }[];
    };
    attendance: {
        pending_today: {
            module_id: number;
            module_code: string;
            module_label: string;
            group_id: number;
            group_label: string;
            date: string;
        }[];
        recent_absences: {
            id: number;
            date: string;
            student_id: number;
            student_name: string;
            module_id: number;
            module_code: string;
            module_label: string;
            group_id: number;
            group_label: string;
        }[];
    };
    quick_actions: { label: string; path: string }[];
}

export interface StudentDashboardData {
    filiere: { id: number; code: string; label: string } | null;
    groupe: { id: number; label: string } | null;
    syllabus_progress: { module: string; progress_percent: number; completed_count: number; total_count: number }[];
    latest_grades: { evaluation: string; module: string; value: number; date: string }[];
    attendance: {
        history: {
            id: number;
            date: string;
            status: 'present' | 'absent' | 'late';
            minutes_late: number | null;
            module: { id: number; code: string; label: string } | null;
            group: { id: number; label: string } | null;
        }[];
        monthly_summary: {
            from: string;
            to: string;
            total_count: number;
            present_count: number;
            absent_count: number;
            late_count: number;
            attendance_rate_percent: number;
            absence_rate_percent: number;
        };
        is_risk: boolean;
    };
    quick_actions: { label: string; path: string }[];
}

export interface ParentChild {
    id: number;
    name: string;
    filiere: string | null;
    groupe: string | null;
    /** Backend: stagiaires.status (actif, abandon, …) */
    status?: string;
    attendance_percent: number | null;
    is_risk: boolean;
    latest_grades: { evaluation: string; module: string; value: number }[];
}

export interface ParentDashboardData {
    children: ParentChild[];
    alerts: ParentChild[];
    attendance: {
        child_overview: {
            child_id: number;
            student_user_id: number;
            child_name: string;
            monthly_summary: {
                from: string;
                to: string;
                total_count: number;
                present_count: number;
                absent_count: number;
                late_count: number;
                attendance_rate_percent: number;
                absence_rate_percent: number;
            };
            is_risk: boolean;
        }[];
    };
    quick_actions: { label: string; path: string }[];
}

const EMPTY_MONTHLY: StudentDashboardData['attendance']['monthly_summary'] = {
    from: '',
    to: '',
    total_count: 0,
    present_count: 0,
    absent_count: 0,
    late_count: 0,
    attendance_rate_percent: 0,
    absence_rate_percent: 0,
};

function normalizeAdminPayload(data: unknown): AdminDashboardData {
    const d = (data && typeof data === 'object' ? data : {}) as Partial<AdminDashboardData>;
    const attendance = (d.attendance && typeof d.attendance === 'object' ? d.attendance : {}) as Partial<AdminDashboardData['attendance']>;
    return {
        stats: {
            total_students: Number(d.stats?.total_students ?? 0),
            total_teachers: Number(d.stats?.total_teachers ?? 0),
            total_filieres: Number(d.stats?.total_filieres ?? 0),
            total_groupes: Number(d.stats?.total_groupes ?? 0),
        },
        charts: {
            students_per_filiere: Array.isArray(d.charts?.students_per_filiere) ? d.charts!.students_per_filiere : [],
        },
        attendance: {
            absence_rate_by_group_module: Array.isArray(attendance.absence_rate_by_group_module)
                ? attendance.absence_rate_by_group_module
                : [],
            monthly_summary: Array.isArray(attendance.monthly_summary) ? attendance.monthly_summary : [],
        },
        quick_actions: Array.isArray(d.quick_actions) ? d.quick_actions : [],
    };
}

function normalizeTeacherPayload(data: unknown): TeacherDashboardData {
    const d = (data && typeof data === 'object' ? data : {}) as Partial<TeacherDashboardData>;
    const att = (d.attendance && typeof d.attendance === 'object' ? d.attendance : {}) as Partial<TeacherDashboardData['attendance']>;
    return {
        todays_sessions: Array.isArray(d.todays_sessions) ? d.todays_sessions : [],
        assigned_modules: Array.isArray(d.assigned_modules) ? d.assigned_modules : [],
        teaching_scope:
            d.teaching_scope && typeof d.teaching_scope === 'object'
                ? {
                      filiere: d.teaching_scope.filiere ?? null,
                      modules_count: Number(d.teaching_scope.modules_count ?? 0),
                      groups_count: Number(d.teaching_scope.groups_count ?? 0),
                      stagiaires_count: Number(d.teaching_scope.stagiaires_count ?? 0),
                      stagiaires: Array.isArray(d.teaching_scope.stagiaires) ? d.teaching_scope.stagiaires : [],
                  }
                : undefined,
        attendance: {
            pending_today: Array.isArray(att.pending_today) ? att.pending_today : [],
            recent_absences: Array.isArray(att.recent_absences) ? att.recent_absences : [],
        },
        quick_actions: Array.isArray(d.quick_actions) ? d.quick_actions : [],
    };
}

function normalizeStudentPayload(data: unknown): StudentDashboardData {
    const d = (data && typeof data === 'object' ? data : {}) as Partial<StudentDashboardData>;
    const att = (d.attendance && typeof d.attendance === 'object' ? d.attendance : {}) as Partial<StudentDashboardData['attendance']>;
    return {
        filiere: d.filiere ?? null,
        groupe: d.groupe ?? null,
        syllabus_progress: Array.isArray(d.syllabus_progress) ? d.syllabus_progress : [],
        latest_grades: Array.isArray(d.latest_grades) ? d.latest_grades : [],
        attendance: {
            history: Array.isArray(att.history) ? att.history : [],
            monthly_summary:
                att.monthly_summary && typeof att.monthly_summary === 'object'
                    ? { ...EMPTY_MONTHLY, ...att.monthly_summary }
                    : { ...EMPTY_MONTHLY },
            is_risk: Boolean(att.is_risk),
        },
        quick_actions: Array.isArray(d.quick_actions) ? d.quick_actions : [],
    };
}

function normalizeParentPayload(data: unknown): ParentDashboardData {
    const d = (data && typeof data === 'object' ? data : {}) as Partial<ParentDashboardData>;
    const att = (d.attendance && typeof d.attendance === 'object' ? d.attendance : {}) as Partial<ParentDashboardData['attendance']>;
    return {
        children: Array.isArray(d.children) ? d.children : [],
        alerts: Array.isArray(d.alerts) ? d.alerts : [],
        attendance: {
            child_overview: Array.isArray(att.child_overview) ? att.child_overview : [],
        },
        quick_actions: Array.isArray(d.quick_actions) ? d.quick_actions : [],
    };
}

function normalizeByRole(role: DashboardResponse['role'], data: unknown): unknown {
    switch (role) {
        case 'admin':
        case 'directeur':
        case 'secretariat':
            return normalizeAdminPayload(data);
        case 'teacher':
        case 'formateur':
            return normalizeTeacherPayload(data);
        case 'student':
        case 'stagiaire':
            return normalizeStudentPayload(data);
        case 'parent':
            return normalizeParentPayload(data);
        default:
            return data;
    }
}

export interface RecentAbsencesResponse {
    absence_rate_by_group_module: {
        group_id: number;
        group_label: string;
        module_id: number;
        module_code: string;
        module_label: string;
        total_count: number;
        absent_count: number;
        absence_rate_percent: number;
        is_risk: boolean;
    }[];
}

export const dashboardService = {
    async getDashboard(fallbackRole?: string): Promise<DashboardResponse> {
        const res = await api.get<{ role?: string; data?: unknown } | { data: { role?: string; data?: unknown } }>('/dashboard');
        const raw = res.data ?? {};
        const payload =
            raw && typeof raw === 'object' && 'data' in raw && raw.data && typeof raw.data === 'object' && 'role' in (raw.data as object)
                ? (raw.data as { role: string; data: unknown })
                : (raw as { role?: string; data?: unknown });
        const validRoles = ['admin', 'directeur', 'secretariat', 'teacher', 'formateur', 'student', 'stagiaire', 'parent'] as const;
        const roleFromApi = payload.role && validRoles.includes(payload.role as (typeof validRoles)[number]) ? payload.role : null;
        const roleFromUser =
            fallbackRole && validRoles.includes(fallbackRole as (typeof validRoles)[number]) ? fallbackRole : null;
        const role = (roleFromApi ?? roleFromUser) as DashboardResponse['role'] | null;
        if (!role) {
            throw new Error('Role dashboard invalide ou manquant.');
        }

        return { role, data: normalizeByRole(role, payload.data) };
    },
    async getRecentAbsences(): Promise<RecentAbsencesResponse> {
        // First try to hit a dedicated endpoint if it exists
        try {
            const res = await api.get<RecentAbsencesResponse>('/dashboard/admin/recent-absences');
            return res.data;
        } catch (error: any) {
            // Fallback: If 404, we fetch the monolithic dashboard and extract it to prevent breaking.
            if (error?.response?.status === 404) {
                const fullDashboard = await dashboardService.getDashboard('admin');
                const adminData = fullDashboard.data as AdminDashboardData;
                return {
                    absence_rate_by_group_module: adminData.attendance?.absence_rate_by_group_module || [],
                };
            }
            throw error;
        }
    },
};

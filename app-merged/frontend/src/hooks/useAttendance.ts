import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formateurAssignmentsApi } from '../api/api/formateurAssignments';
import { groupsApi } from '../api/api/groups';
import { attendanceApi, type AttendanceStatus } from '../api/api/attendance';
import { getApiErrorMessage } from '../lib/api-error';
import { useAuth } from './useAuth';

export type RowState = {
    studentId: number;
    name: string;
    status: AttendanceStatus;
    minutesLate: string;
    note: string;
};

export type FieldErrors = {
    filiereId?: string;
    moduleId?: string;
    groupId?: string;
    date?: string;
    rows: Record<number, string>;
};

const EMPTY_ERRORS: FieldErrors = { rows: {} };

export function computeAcademicYear(dateISO: string): string {
    const d = new Date(dateISO);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const start = month >= 9 ? year : year - 1;
    return `${start}-${start + 1}`;
}

export type FiliereOption = { id: number; code: string; label: string };

export function useAttendance() {
    const { user } = useAuth();
    const canTakeAttendance = user?.role === 'teacher' || user?.role === 'formateur';
    const [filiereId, setFiliereId] = useState<number | ''>('');
    const [moduleId, setModuleId] = useState<number | ''>('');
    const [groupId, setGroupId] = useState<number | ''>('');
    const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
    const [rows, setRows] = useState<RowState[]>([]);
    const [errors, setErrors] = useState<FieldErrors>(EMPTY_ERRORS);
    const [sessionMessage, setSessionMessage] = useState<string>('');
    const [sessionWarning, setSessionWarning] = useState<string>('');

    const { data: assignments, isLoading: assignmentsLoading } = useQuery({
        queryKey: ['attendance', 'assignments', user?.id, user?.role, date],
        queryFn: () => formateurAssignmentsApi.me({ date }),
        enabled: canTakeAttendance,
    });

    const modules = useMemo(() => assignments?.modules ?? [], [assignments?.modules]);

    /** Unique filières inferred from assigned groupes (API attaches filiere on each groupe). */
    const filieresOptions = useMemo((): FiliereOption[] => {
        const map = new Map<number, FiliereOption>();
        for (const m of modules) {
            for (const g of m.groupes) {
                if (g.filiere?.id != null) {
                    map.set(g.filiere.id, {
                        id: g.filiere.id,
                        code: g.filiere.code,
                        label: g.filiere.label,
                    });
                }
            }
        }
        return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label, 'fr'));
    }, [modules]);

    const needsFiliereStep = filieresOptions.length > 0;

    /** Modules that have at least one groupe in the selected filière (when filière step applies). */
    const modulesForFiliere = useMemo(() => {
        if (!needsFiliereStep) {
            return modules;
        }
        if (filiereId === '') {
            return [];
        }
        const fid = Number(filiereId);
        return modules.filter((m) => m.groupes.some((g) => g.filiere?.id === fid));
    }, [modules, needsFiliereStep, filiereId]);

    const selectedModule = useMemo(
        () => modulesForFiliere.find((m) => m.id === Number(moduleId)),
        [modulesForFiliere, moduleId]
    );

    /** Groupes for the selected module, restricted to the active filière when applicable. */
    const groups = useMemo(() => {
        const raw = selectedModule?.groupes ?? [];
        if (!needsFiliereStep || filiereId === '') {
            return raw;
        }
        const fid = Number(filiereId);
        return raw.filter((g) => g.filiere?.id === fid);
    }, [selectedModule, needsFiliereStep, filiereId]);

    /* Auto-select filière when the teacher only has one. */
    const [filiereInit, setFiliereInit] = useState(false);
    if (!filiereInit && needsFiliereStep && filiereId === '' && filieresOptions.length === 1) {
        setFiliereInit(true);
        setFiliereId(filieresOptions[0].id);
    }

    const { data: groupDetails, isLoading: groupLoading } = useQuery({
        queryKey: ['attendance', 'group-details', groupId],
        queryFn: () => groupsApi.get(Number(groupId)),
        enabled: !!groupId,
    });

    const detectQuery = useQuery({
        queryKey: ['attendance', 'detect', moduleId, groupId, date],
        queryFn: () =>
            attendanceApi.detectMarkedSession({
                module_id: Number(moduleId),
                group_id: Number(groupId),
                date,
                academic_year: computeAcademicYear(date),
            }),
        enabled: !!moduleId && !!groupId && !!date,
    });

    const [prevFiliereId, setPrevFiliereId] = useState(filiereId);
    if (filiereId !== prevFiliereId) {
        setPrevFiliereId(filiereId);
        setModuleId('');
        setGroupId('');
        setRows([]);
        setSessionMessage('');
        setSessionWarning('');
        setErrors(EMPTY_ERRORS);
    }

    const [prevModuleId, setPrevModuleId] = useState(moduleId);
    if (moduleId !== prevModuleId) {
        setPrevModuleId(moduleId);
        setGroupId('');
        setRows([]);
        setSessionMessage('');
        setSessionWarning('');
        setErrors(EMPTY_ERRORS);
    }

    const [prevGroupId, setPrevGroupId] = useState(groupId);
    const [prevDate, setPrevDate] = useState(date);
    if (groupId !== prevGroupId || date !== prevDate) {
        setPrevGroupId(groupId);
        setPrevDate(date);
        setSessionMessage('');
        setSessionWarning('');
        setErrors(EMPTY_ERRORS);
    }

    const [prevGroupDetails, setPrevGroupDetails] = useState(groupDetails);
    if (groupDetails !== prevGroupDetails) {
        setPrevGroupDetails(groupDetails);
        const stagiaires = (groupDetails?.stagiaires ?? []) as Array<{
            id: number;
            user_id?: number;
            user?: { id?: number; name?: string };
        }>;

        if (!stagiaires.length) {
            setRows([]);
        } else {
            const normalized = stagiaires
                .map((s) => {
                    const studentId = s.user_id ?? s.user?.id ?? 0;
                    return {
                        studentId,
                        name: s.user?.name ?? `Student #${studentId}`,
                        status: 'present' as AttendanceStatus,
                        minutesLate: '',
                        note: '',
                    };
                })
                .filter((r) => r.studentId > 0);

            setRows(normalized);
        }
    }

    const [appliedDataKey, setAppliedDataKey] = useState<string | null>(null);
    const data = detectQuery.data;
    const currentDataKey = data ? `${groupId}-${date}-${data.length}` : null;

    if (data !== undefined && data !== null && rows.length > 0 && appliedDataKey !== currentDataKey) {
        setAppliedDataKey(currentDataKey);
        if (data.length === 0) {
            setSessionWarning('');
        } else {
            const byStudent = new Map(data.map((r) => [r.student_id, r]));
            setRows((prev) =>
                prev.map((row) => {
                    const existing = byStudent.get(row.studentId);
                    if (!existing) {
                        return row;
                    }
                    return {
                        ...row,
                        status: existing.status,
                        minutesLate: existing.minutes_late ? String(existing.minutes_late) : '',
                        note: existing.note ?? '',
                    };
                })
            );
            setSessionWarning('Session déjà marquée pour cette date. Les valeurs existantes ont été chargées.');
        }
    }

    // Performance: useCallback ensures stable references for memoized components
    // and column definitions that depend on these handlers.
    const updateRow = useCallback((studentId: number, patch: Partial<RowState>) => {
        setRows((prev) =>
            prev.map((row) => (row.studentId === studentId ? { ...row, ...patch } : row))
        );
    }, []);

    const setAllStatus = useCallback((status: AttendanceStatus) => {
        setRows((prev) =>
            prev.map((row) => ({
                ...row,
                status,
                minutesLate: status === 'late' ? row.minutesLate : '',
            }))
        );
    }, []);

    const summaryCounts = useMemo(() => {
        let present = 0;
        let absent = 0;
        let late = 0;
        for (const r of rows) {
            if (r.status === 'present') {
                present++;
            } else if (r.status === 'absent') {
                absent++;
            } else {
                late++;
            }
        }
        return { present, absent, late, total: rows.length };
    }, [rows]);

    const validate = (): boolean => {
        const nextErrors: FieldErrors = { rows: {} };

        if (needsFiliereStep && filiereId === '') {
            nextErrors.filiereId = 'Filière requise.';
        }
        if (!moduleId) nextErrors.moduleId = 'Module requis.';
        if (!groupId) nextErrors.groupId = 'Groupe requis.';
        if (!date) nextErrors.date = 'Date requise.';
        if (rows.length === 0) nextErrors.groupId = 'Aucun stagiaire trouvé dans ce groupe.';

        for (const row of rows) {
            if (row.status === 'late') {
                const parsed = Number(row.minutesLate);
                if (!row.minutesLate || Number.isNaN(parsed) || parsed <= 0) {
                    nextErrors.rows[row.studentId] = 'Minutes de retard requises (> 0).';
                }
            }
        }

        setErrors(nextErrors);
        return (
            !nextErrors.filiereId &&
            !nextErrors.moduleId &&
            !nextErrors.groupId &&
            !nextErrors.date &&
            Object.keys(nextErrors.rows).length === 0
        );
    };

    const saveMutation = useMutation({
        mutationFn: async () => {
            const payload = {
                module_id: Number(moduleId),
                group_id: Number(groupId),
                date,
                academic_year: computeAcademicYear(date),
                attendances: rows.map((row) => ({
                    student_id: row.studentId,
                    status: row.status,
                    minutes_late: row.status === 'late' ? Number(row.minutesLate) : undefined,
                    note: row.note || undefined,
                })),
            };
            return attendanceApi.markSession(payload);
        },
        onSuccess: (result) => {
            const summary = result.summary;
            if (summary.updated > 0 && summary.created === 0) {
                setSessionWarning('Session déjà marquée: les présences ont été mises à jour.');
            } else if (summary.updated > 0) {
                setSessionWarning('Certaines présences existaient déjà et ont été mises à jour.');
            } else {
                setSessionWarning('');
            }
            setSessionMessage('Présences enregistrées avec succès.');
            toast.success('Présences enregistrées.');
        },
        onError: (error) => {
            setSessionMessage('');
            toast.error(getApiErrorMessage(error, "Erreur lors de l'enregistrement."));
        },
    });

    const handleSave = () => {
        setSessionMessage('');
        setSessionWarning('');
        if (!validate()) {
            toast.error('Veuillez corriger les erreurs.');
            return;
        }
        const ok = window.confirm(
            "Confirmer l'enregistrement des présences pour cette séance ? Cette action met à jour la base centrale."
        );
        if (!ok) {
            return;
        }
        saveMutation.mutate();
    };

    return {
        canTakeAttendance,
        filiereId,
        setFiliereId,
        filieresOptions,
        needsFiliereStep,
        moduleId,
        setModuleId,
        groupId,
        setGroupId,
        date,
        setDate,
        rows,
        updateRow,
        setAllStatus,
        errors,
        sessionMessage,
        sessionWarning,
        assignmentsLoading,
        groupLoading,
        detectLoading: detectQuery.isFetching,
        modules: modulesForFiliere,
        groups,
        handleSave,
        isSaving: saveMutation.isPending,
        summaryCounts,
    };
}

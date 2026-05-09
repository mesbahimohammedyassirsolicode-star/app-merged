import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  gradesApi,
  type TrainerGradeEntryFiliere,
  type TrainerGradeEntryGroup,
  type TrainerGradeEntryModule,
} from '../api/api/grades';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { getApiErrorMessage } from '../lib/api-error';

type RowSaveStatus = 'idle' | 'saved' | 'error';

function extractEntryValidationErrors(error: unknown): Record<number, string> {
  const bag = (error as { response?: { data?: { errors?: Record<string, string[]> } } })?.response?.data?.errors;
  if (!bag || typeof bag !== 'object') return {};

  const mapped: Record<number, string> = {};
  Object.entries(bag).forEach(([key, messages]) => {
    const match = key.match(/^entries\.(\d+)\./);
    if (!match) return;
    const index = Number(match[1]);
    if (Number.isNaN(index)) return;
    mapped[index] = messages?.[0] ?? 'Validation error';
  });

  return mapped;
}

export default function GradeEntryPage() {
  const [data, setData] = useState<TrainerGradeEntryFiliere[]>([]);
  const [selectedFiliere, setFiliere] = useState<number | null>(null);
  const [selectedGroup, setGroup] = useState<number | null>(null);
  const [selectedModule, setModule] = useState<number | null>(null);
  const [grades, setGrades] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rowStatuses, setRowStatuses] = useState<Record<number, RowSaveStatus>>({});
  const [rowErrors, setRowErrors] = useState<Record<number, string>>({});

  const loadQuery = useQuery({
    queryKey: ['trainer-grade-entry-data'],
    queryFn: () => gradesApi.trainerGradeEntryData(),
  });

  useEffect(() => {
    if (loadQuery.data) {
      setData(loadQuery.data);
      setLoading(false);
    }
  }, [loadQuery.data]);

  useEffect(() => {
    if (loadQuery.isError) {
      setLoading(false);
    }
  }, [loadQuery.isError]);

  const selectedFiliereData = useMemo(
    () => data.find((item) => item.filiere_id === selectedFiliere) ?? null,
    [data, selectedFiliere],
  );

  const groups = useMemo<TrainerGradeEntryGroup[]>(
    () => selectedFiliereData?.groups ?? [],
    [selectedFiliereData],
  );

  const selectedGroupData = useMemo(
    () => groups.find((item) => item.group_id === selectedGroup) ?? null,
    [groups, selectedGroup],
  );

  const modules = useMemo<TrainerGradeEntryModule[]>(
    () => selectedGroupData?.modules ?? [],
    [selectedGroupData],
  );

  const selectedModuleData = useMemo(
    () => modules.find((item) => item.module_id === selectedModule) ?? null,
    [modules, selectedModule],
  );

  const students = useMemo(
    () => selectedModuleData?.students ?? [],
    [selectedModuleData],
  );

  useEffect(() => {
    if (!selectedModuleData) {
      setGrades({});
      setRowStatuses({});
      setRowErrors({});
      return;
    }

    const initial: Record<number, string> = {};
    selectedModuleData.students.forEach((student) => {
      initial[student.id] = student.existing_grade !== null ? String(student.existing_grade) : '';
    });

    setGrades(initial);
    setRowStatuses({});
    setRowErrors({});
  }, [selectedModuleData]);

  const invalidStudentIds = useMemo(() => {
    const invalid: number[] = [];
    students.forEach((student) => {
      const raw = (grades[student.id] ?? '').trim();
      const parsed = Number(raw);
      if (raw === '' || Number.isNaN(parsed) || parsed < 0 || parsed > 20) {
        invalid.push(student.id);
      }
    });
    return invalid;
  }, [students, grades]);

  const modifiedEntries = useMemo(() => {
    if (!selectedModule) return [];

    return students
      .filter((student) => {
        const current = (grades[student.id] ?? '').trim();
        const initial = student.existing_grade !== null ? String(student.existing_grade) : '';
        return current !== initial;
      })
      .map((student) => ({
        module_id: selectedModule,
        student_id: student.id,
        grade: Number((grades[student.id] ?? '').trim()),
      }));
  }, [students, grades, selectedModule]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      setSaving(true);
      return gradesApi.saveTrainerGrades(modifiedEntries);
    },
    onSuccess: (savedRows) => {
      const nextStatuses: Record<number, RowSaveStatus> = {};
      savedRows.forEach((entry) => {
        nextStatuses[entry.student_id] = 'saved';
      });
      setRowStatuses((prev) => ({ ...prev, ...nextStatuses }));
      setRowErrors({});
      toast.success('Grades saved successfully.');
    },
    onError: (error: unknown) => {
      const message = getApiErrorMessage(error, 'Unable to save grades.');
      const entryValidationErrors = extractEntryValidationErrors(error);

      setRowStatuses((prev) => {
        const next = { ...prev };
        modifiedEntries.forEach((entry, index) => {
          next[entry.student_id] = 'error';
          if (entryValidationErrors[index]) {
            next[entry.student_id] = 'error';
          }
        });
        return next;
      });
      setRowErrors((prev) => {
        const next = { ...prev };
        modifiedEntries.forEach((entry, index) => {
          next[entry.student_id] = entryValidationErrors[index] ?? message;
        });
        return next;
      });
      toast.error(message);
    },
    onSettled: () => {
      setSaving(false);
    },
  });

  const canSave =
    selectedModule !== null &&
    students.length > 0 &&
    modifiedEntries.length > 0 &&
    invalidStudentIds.length === 0 &&
    !saving;

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6">
        <div className="space-y-2">
          <div className="h-8 w-52 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-72 animate-pulse rounded bg-gray-100" />
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                <div className="h-10 animate-pulse rounded bg-gray-100" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-gray-900">Grade Entry</h1>
        <p className="text-sm text-gray-500">Enter grades using trainer-scoped filieres, groups, and modules.</p>
      </div>

      {loadQuery.isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {getApiErrorMessage(loadQuery.error, 'Unable to load grade entry data.')}
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <label htmlFor="filiere-select" className="text-sm font-medium text-gray-700">
              Filiere
            </label>
            <select
              id="filiere-select"
              className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm focus:border-blue-500 focus:outline-none"
              value={selectedFiliere ?? ''}
              onChange={(e) => {
                const next = e.target.value ? Number(e.target.value) : null;
                setFiliere(next);
                setGroup(null);
                setModule(null);
              }}
            >
              <option value="">Select a filiere</option>
              {data.map((item) => (
                <option key={item.filiere_id} value={item.filiere_id}>
                  {item.filiere_name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="group-select" className="text-sm font-medium text-gray-700">
              Group
            </label>
            <select
              id="group-select"
              className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100"
              value={selectedGroup ?? ''}
              onChange={(e) => {
                const next = e.target.value ? Number(e.target.value) : null;
                setGroup(next);
                setModule(null);
              }}
              disabled={selectedFiliere === null}
            >
              <option value="">
                {selectedFiliere === null
                  ? 'Select a filiere first'
                  : groups.length === 0
                    ? 'No groups available'
                    : 'Select a group'}
              </option>
              {groups.map((item) => (
                <option key={item.group_id} value={item.group_id}>
                  {item.group_name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="module-select" className="text-sm font-medium text-gray-700">
              Module
            </label>
            <select
              id="module-select"
              className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100"
              value={selectedModule ?? ''}
              onChange={(e) => setModule(e.target.value ? Number(e.target.value) : null)}
              disabled={selectedGroup === null}
            >
              <option value="">
                {selectedGroup === null
                  ? 'Select a group first'
                  : modules.length === 0
                    ? 'No modules for this group'
                    : 'Select a module'}
              </option>
              {modules.map((item) => (
                <option key={item.module_id} value={item.module_id}>
                  {item.module_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4 md:px-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {selectedModule === null
                ? 'Select a module to start grade entry.'
                : `${students.length} student${students.length > 1 ? 's' : ''} in selected module.`}
            </p>
            <Button
              disabled={!canSave}
              onClick={() => saveMutation.mutate()}
            >
              {saving ? 'Saving...' : 'Save all modified grades'}
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">#</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Student Name</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Grade (0-20)</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Save feedback</th>
              </tr>
            </thead>
            <tbody>
              {selectedModule === null && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500">
                    Select a filiere, group, and module to view students.
                  </td>
                </tr>
              )}

              {selectedModule !== null && students.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500">
                    No students found for this module.
                  </td>
                </tr>
              )}

              {selectedModule !== null && students.map((student, index) => {
                const raw = (grades[student.id] ?? '').trim();
                const numeric = Number(raw);
                const isInvalid = raw === '' || Number.isNaN(numeric) || numeric < 0 || numeric > 20;
                const status = !isInvalid && numeric >= 10 ? 'Valide' : 'Insuffisant';
                const saveStatus = rowStatuses[student.id] ?? 'idle';

                return (
                  <tr key={student.id} className="border-t">
                    <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{student.name}</td>
                    <td className="w-56 px-4 py-3">
                      <Input
                        type="number"
                        min={0}
                        max={20}
                        step={0.25}
                        value={grades[student.id] ?? ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          setGrades((prev) => ({ ...prev, [student.id]: value }));
                          setRowStatuses((prev) => ({ ...prev, [student.id]: 'idle' }));
                          setRowErrors((prev) => ({ ...prev, [student.id]: '' }));
                        }}
                        aria-invalid={isInvalid}
                        className={isInvalid ? 'border-red-400 focus-visible:ring-red-200' : ''}
                      />
                      {isInvalid && (
                        <p className="mt-1 text-xs text-red-600">Grade must be between 0 and 20.</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          !isInvalid && numeric >= 10 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {saveStatus === 'saved' && <span className="text-emerald-700">Saved ✓</span>}
                      {saveStatus === 'error' && (
                        <span className="text-rose-700">{rowErrors[student.id] || 'Error ✗'}</span>
                      )}
                      {saveStatus === 'idle' && <span className="text-gray-400">-</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

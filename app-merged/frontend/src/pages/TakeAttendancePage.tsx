import { useMemo, useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  createColumnHelper,
  useReactTable,
} from '@tanstack/react-table';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useAttendance, type RowState } from '../hooks/useAttendance';
import type { TeacherAssignmentModule } from '../api/api/formateurAssignments';
import type { AttendanceStatus } from '../api/api/attendance';

const columnHelper = createColumnHelper<RowState>();

export default function TakeAttendancePage() {
  const {
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
    detectLoading,
    modules,
    groups,
    handleSave,
    isSaving,
    summaryCounts,
  } = useAttendance();

  const [statusFilter, setStatusFilter] = useState<'all' | AttendanceStatus>('all');

  const visibleRows = useMemo(() => {
    if (statusFilter === 'all') {
      return rows;
    }
    return rows.filter((r) => r.status === statusFilter);
  }, [rows, statusFilter]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Stagiaire',
        cell: (info) => <span className="font-medium text-gray-900">{info.getValue()}</span>,
      }),
      columnHelper.display({
        id: 'status',
        header: 'Présence',
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="flex flex-wrap gap-3 text-sm">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-transparent px-2 py-1 hover:bg-gray-50">
                <input
                  type="radio"
                  name={`status-${r.studentId}`}
                  checked={r.status === 'present'}
                  onChange={() => updateRow(r.studentId, { status: 'present', minutesLate: '' })}
                />
                Présent
              </label>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-transparent px-2 py-1 hover:bg-gray-50">
                <input
                  type="radio"
                  name={`status-${r.studentId}`}
                  checked={r.status === 'absent'}
                  onChange={() => updateRow(r.studentId, { status: 'absent', minutesLate: '' })}
                />
                Absent
              </label>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-transparent px-2 py-1 hover:bg-gray-50">
                <input
                  type="radio"
                  name={`status-${r.studentId}`}
                  checked={r.status === 'late'}
                  onChange={() => updateRow(r.studentId, { status: 'late' })}
                />
                Retard
              </label>
            </div>
          );
        },
      }),
      columnHelper.accessor('minutesLate', {
        header: 'Retard (min)',
        cell: ({ row }) => (
          <input
            type="number"
            min={1}
            disabled={row.original.status !== 'late'}
            value={row.original.minutesLate}
            onChange={(e) => updateRow(row.original.studentId, { minutesLate: e.target.value })}
            className="w-24 rounded border border-gray-300 px-2 py-1 text-sm disabled:bg-gray-100"
          />
        ),
      }),
      columnHelper.accessor('note', {
        header: 'Remarque',
        cell: ({ row }) => (
          <input
            type="text"
            value={row.original.note}
            onChange={(e) => updateRow(row.original.studentId, { note: e.target.value })}
            className="min-w-[140px] max-w-xs rounded border border-gray-300 px-2 py-1 text-sm"
            placeholder="—"
          />
        ),
      }),
    ],
    [updateRow]
  );

  const table = useReactTable({
    data: visibleRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (!canTakeAttendance) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-6 py-10 text-center">
        <p className="font-semibold text-amber-800">Accès restreint</p>
        <p className="mt-1 text-sm text-amber-700">
          La prise de présence est réservée aux formateurs.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Présences</h1>
          <p className="text-sm text-gray-600">
            Module, groupe et date · enregistrement groupé sécurisé par rôle
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="rounded-lg bg-emerald-50 px-3 py-2 ring-1 ring-emerald-100">
            <span className="text-emerald-800 font-semibold">{summaryCounts.present}</span>
            <span className="text-emerald-700"> présents</span>
          </div>
          <div className="rounded-lg bg-rose-50 px-3 py-2 ring-1 ring-rose-100">
            <span className="text-rose-800 font-semibold">{summaryCounts.absent}</span>
            <span className="text-rose-700"> absents</span>
          </div>
          <div className="rounded-lg bg-amber-50 px-3 py-2 ring-1 ring-amber-100">
            <span className="text-amber-900 font-semibold">{summaryCounts.late}</span>
            <span className="text-amber-800"> retards</span>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Séance</CardTitle>
          <p className="text-xs font-normal text-gray-500">
            {needsFiliereStep
              ? 'Choisissez d’abord la filière : seuls les modules et groupes de cette filière sont proposés.'
              : 'Sélectionnez le module, le groupe et la date de séance.'}
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {needsFiliereStep && (
            <div className="space-y-1">
              <label className="text-sm font-medium">Filière</label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                value={filiereId}
                onChange={(e) => setFiliereId(e.target.value ? Number(e.target.value) : '')}
                disabled={assignmentsLoading}
              >
                <option value="">Sélectionner…</option>
                {filieresOptions.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.code} — {f.label}
                  </option>
                ))}
              </select>
              {errors.filiereId && <p className="text-xs text-red-600">{errors.filiereId}</p>}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium">Module</label>
            <select
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              value={moduleId}
              onChange={(e) => setModuleId(e.target.value ? Number(e.target.value) : '')}
              disabled={assignmentsLoading || (needsFiliereStep && filiereId === '')}
            >
              <option value="">Sélectionner…</option>
              {modules.map((m: TeacherAssignmentModule) => (
                <option key={m.id} value={m.id}>
                  {m.code} — {m.label}
                </option>
              ))}
            </select>
            {errors.moduleId && <p className="text-xs text-red-600">{errors.moduleId}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Groupe</label>
            <select
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value ? Number(e.target.value) : '')}
              disabled={!moduleId || (needsFiliereStep && filiereId === '')}
            >
              <option value="">Sélectionner…</option>
              {groups.map((g: TeacherAssignmentModule['groupes'][number]) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
            {errors.groupId && <p className="text-xs text-red-600">{errors.groupId}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            {errors.date && <p className="text-xs text-red-600">{errors.date}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Liste des stagiaires</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs font-medium uppercase tracking-wide text-gray-500">Filtrer</label>
            <select
              className="rounded-md border border-gray-300 px-2 py-1 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | AttendanceStatus)}
            >
              <option value="all">Tous les statuts</option>
              <option value="present">Présents uniquement</option>
              <option value="absent">Absents uniquement</option>
              <option value="late">Retards uniquement</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setAllStatus('present')}>
              Tout présent
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setAllStatus('absent')}>
              Tout absent
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setAllStatus('late')}>
              Tout en retard
            </Button>
          </div>

          {(groupLoading || assignmentsLoading || detectLoading) && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
              <span className="ml-3 text-sm text-gray-600">Chargement…</span>
            </div>
          )}

          {!groupLoading && !detectLoading && rows.length === 0 && (
            <p className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-600">
              Sélectionnez un groupe pour afficher les stagiaires.
            </p>
          )}

          {rows.length > 0 && !groupLoading && (
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  {table.getHeaderGroups().map((hg) => (
                    <tr key={hg.id}>
                      {hg.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {table.getRowModel().rows.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                        Aucun stagiaire pour ce filtre.
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <tr key={row.original.studentId} className="hover:bg-gray-50/80">
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="whitespace-nowrap px-4 py-3 align-top text-gray-800">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {rows.map((row) =>
            errors.rows[row.studentId] ? (
              <p key={`err-${row.studentId}`} className="text-xs text-red-600">
                {row.name}: {errors.rows[row.studentId]}
              </p>
            ) : null
          )}
        </CardContent>
      </Card>

      {sessionMessage && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {sessionMessage}
        </div>
      )}
      {sessionWarning && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {sessionWarning}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Button onClick={handleSave} disabled={isSaving || rows.length === 0}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Enregistrer la séance
        </Button>
      </div>
    </div>
  );
}

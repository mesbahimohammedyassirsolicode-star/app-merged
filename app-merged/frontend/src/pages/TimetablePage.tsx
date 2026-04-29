import { memo, useCallback, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  List,
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  MapPin,
  Clock,
  Wifi,
  WifiOff,
  BookOpen,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useAuth } from '../hooks/useAuth';
import {
  timetableDataApi,
  type TimetableFiliere,
  type TimetableDataSeance,
} from '../api/api/timetableData';
import { timetableApi, type TimetableSeance } from '../api/api/timetable';
import { stagiaireApi } from '../api/api/stagiaire';
import SeanceFormModal from '../components/timetable/SeanceFormModal';
import { getApiErrorMessage } from '../lib/api-error';

// ── Constants ─────────────────────────────────────────────────────────────────

const WEEKDAY_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getMondayISO(date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - (day === 0 ? 6 : day - 1);
  d.setDate(diff);
  // Use local date to avoid UTC-offset bugs
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + n);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Unified display helpers for both DB seances and JSON seances
type AnySeance = TimetableSeance | TimetableDataSeance;

function moduleLabelFromSeance(s: AnySeance): string | undefined {
  if ('subject' in s && s.subject) return s.subject;
  if ('module' in s && s.module && typeof s.module === 'object') {
    const lab = (s.module as { label?: string | null }).label;
    if (lab) return lab;
  }
  if ('affectation' in s) {
    const lab = (s as TimetableSeance).affectation?.module?.label;
    if (lab) return lab;
  }
  return undefined;
}

function seanceName(s: AnySeance): string {
  return moduleLabelFromSeance(s) ?? 'Séance';
}

function teacherName(s: AnySeance): string | undefined {
  if ('teacher' in s && s.teacher && typeof s.teacher === 'object') {
    const n = (s.teacher as { name?: string | null }).name;
    if (n) return n;
  }
  if ('formateur' in s && s.formateur && typeof s.formateur === 'object') {
    const n = (s.formateur as { name?: string | null }).name;
    if (n) return n;
  }
  if ('affectation' in s)
    return (s as TimetableSeance).affectation?.formateur?.user?.name;
  return undefined;
}

function groupLabel(s: AnySeance): string | undefined {
  if ('groupe' in s && s.groupe && typeof s.groupe === 'object') {
    const lab = (s.groupe as { label?: string }).label;
    if (lab) return lab;
  }
  if ('affectation' in s)
    return (s as TimetableSeance).affectation?.groupe?.label;
  return undefined;
}

function roomLabel(s: AnySeance): string | undefined {
  if ('salle' in s) {
    const sal = (s as { salle?: string | null }).salle;
    if (typeof sal === 'string') return sal;
  }
  return undefined;
}

function seanceStartHour(s: AnySeance): number {
  const st = 'start_time' in s ? s.start_time : '';
  return Number(String(st).slice(0, 2));
}

function seanceStatusValue(s: AnySeance): string {
  if ('status' in s && typeof (s as { status?: string }).status === 'string') {
    return (s as { status: string }).status;
  }
  return 'planifie';
}

function seanceTypeValue(s: AnySeance): string {
  if ('type' in s && typeof (s as { type?: string }).type === 'string') {
    return (s as { type: string }).type;
  }
  return 'presentiel';
}

function seanceStableKey(s: AnySeance, idx: number): number | string {
  if ('id' in s && typeof (s as { id?: number }).id === 'number') {
    return (s as { id: number }).id;
  }
  return idx;
}

// ── Color palette for modules ─────────────────────────────────────────────────

const MODULE_COLORS = [
  'border-l-4 border-l-indigo-400 bg-indigo-50',
  'border-l-4 border-l-emerald-400 bg-emerald-50',
  'border-l-4 border-l-amber-400 bg-amber-50',
  'border-l-4 border-l-rose-400 bg-rose-50',
  'border-l-4 border-l-violet-400 bg-violet-50',
  'border-l-4 border-l-cyan-400 bg-cyan-50',
  'border-l-4 border-l-orange-400 bg-orange-50',
  'border-l-4 border-l-teal-400 bg-teal-50',
  'border-l-4 border-l-pink-400 bg-pink-50',
  'border-l-4 border-l-lime-400 bg-lime-50',
];

function getModuleColor(code: string | undefined | null): string {
  if (!code) return MODULE_COLORS[0];
  let hash = 0;
  for (let i = 0; i < code.length; i++) hash = (hash * 31 + code.charCodeAt(i)) & 0xffff;
  return MODULE_COLORS[hash % MODULE_COLORS.length];
}

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  planifie: 'bg-blue-100 text-blue-700 border-blue-200',
  realise: 'bg-green-100 text-green-700 border-green-200',
  annule: 'bg-red-100 text-red-500 border-red-200 line-through opacity-70',
};

const STATUS_LABELS: Record<string, string> = {
  planifie: 'Planifié',
  realise: 'Réalisé',
  annule: 'Annulé',
};

// Performance: React.memo prevents re-render when status hasn't changed
const StatusBadge = memo(function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-semibold ${
        STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600 border-gray-200'
      }`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
});

// ── SeanceCard ────────────────────────────────────────────────────────────────

interface SeanceCardProps {
  seance: AnySeance;
  moduleCode?: string | null;
  canEdit: boolean;
  onEdit?: (s: TimetableSeance) => void;
  onDelete?: (id: number) => void;
  deleting?: number | null;
  compact?: boolean;
}

// Performance: React.memo prevents re-rendering ~66+ calendar cells when only
// unrelated parent state changes (e.g. modal open, week navigation).
const SeanceCard = memo(function SeanceCard({
  seance: s,
  moduleCode,
  canEdit,
  onEdit,
  onDelete,
  deleting,
  compact,
}: SeanceCardProps) {
  const isDbSeance =
    !!(s as TimetableSeance).status && typeof (s as TimetableSeance).id === 'number';
  const isDeletingThis = isDbSeance && deleting === (s as TimetableSeance).id;
  const colorClass = getModuleColor(moduleCode ?? (s as TimetableDataSeance).module?.code);

  return (
    <div
      className={`group relative rounded-xl border border-slate-200 shadow-sm transition-shadow hover:shadow-md ${
        seanceStatusValue(s) === 'annule' ? 'opacity-60' : ''
      } ${compact ? 'p-2 text-xs' : 'p-3 text-sm'} ${colorClass}`}
    >
      {/* DB seance actions */}
      {canEdit && isDbSeance && onEdit && onDelete && (
        <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => onEdit(s as TimetableSeance)}
            className="rounded bg-white p-1 shadow hover:bg-slate-100"
            title="Modifier"
          >
            <Pencil className="h-3 w-3 text-slate-600" />
          </button>
          <button
            onClick={() => onDelete((s as TimetableSeance).id)}
            disabled={isDeletingThis}
            className="rounded bg-white p-1 shadow hover:bg-red-50"
            title="Supprimer"
          >
            {isDeletingThis ? (
              <Loader2 className="h-3 w-3 animate-spin text-red-400" />
            ) : (
              <Trash2 className="h-3 w-3 text-red-400" />
            )}
          </button>
        </div>
      )}

      {/* Module label */}
      <p className={`font-semibold text-slate-900 leading-tight ${compact ? 'truncate' : ''}`}>
        {seanceName(s)}
      </p>

      {/* Module code badge */}
      {(moduleCode ?? (s as TimetableDataSeance).module?.code) && (
        <p className="mt-0.5 text-[10px] font-mono text-slate-400">
          {moduleCode ?? (s as TimetableDataSeance).module?.code}
        </p>
      )}

      {/* Time */}
      <p className="mt-0.5 flex items-center gap-1 text-slate-500">
        <Clock className="h-3 w-3 shrink-0" />
        {String('start_time' in s ? s.start_time : '').slice(0, 5)} –{' '}
        {String('end_time' in s ? s.end_time : '').slice(0, 5)}
      </p>

      {!compact && (
        <>
          {groupLabel(s) && (
            <p className="mt-0.5 flex items-center gap-1 text-slate-500">
              <Users className="h-3 w-3 shrink-0" />
              {groupLabel(s)}
            </p>
          )}
          {teacherName(s) && (
            <p className="mt-0.5 truncate text-slate-500" title={teacherName(s)}>
              {teacherName(s)}
            </p>
          )}
          {roomLabel(s) && (
            <p className="mt-0.5 flex items-center gap-1 font-medium text-indigo-600">
              <MapPin className="h-3 w-3 shrink-0" />
              {roomLabel(s)}
            </p>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <StatusBadge status={seanceStatusValue(s)} />
            {seanceTypeValue(s) === 'distance' ? (
              <span className="flex items-center gap-0.5 rounded border border-purple-200 bg-purple-50 px-1.5 py-0.5 text-[10px] font-semibold text-purple-600">
                <Wifi className="h-2.5 w-2.5" /> Distance
              </span>
            ) : (
              <span className="flex items-center gap-0.5 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-500">
                <WifiOff className="h-2.5 w-2.5" /> Présentiel
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
});

// ── FilièreSelector ────────────────────────────────────────────────────────────

interface FiliereSelectorProps {
  filieres: TimetableFiliere[];
  value: string;
  onChange: (code: string) => void;
}

// Performance: React.memo prevents re-render on every parent state change
const FiliereSelector = memo(function FiliereSelector({ filieres, value, onChange }: FiliereSelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="app-control h-9 min-w-[220px]"
    >
      <option value="">— Sélectionner une filière —</option>
      {filieres.map((f) => (
        <option key={f.code} value={f.code}>
          {f.code} — {f.label}
        </option>
      ))}
    </select>
  );
});

// ── Main Component ────────────────────────────────────────────────────────────

type ViewMode = 'calendar' | 'list';

export default function TimetablePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const isStudent = user?.role === 'student' || user?.role === 'stagiaire';
  const isFormateur = user?.role === 'formateur' || user?.role === 'teacher';
  const canEdit = ['admin', 'directeur', 'secretariat', 'formateur', 'teacher'].includes(
    user?.role ?? ''
  );

  // ── State ──────────────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [weekStart, setWeekStart] = useState(() => getMondayISO());
  const [filiereCode, setFiliereCode] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSeance, setEditingSeance] = useState<TimetableSeance | null>(null);
  const [defaultDate, setDefaultDate] = useState<string | undefined>();
  const [deleting, setDeleting] = useState<number | null>(null);

  // ── Filières list (from JSON files) ────────────────────────────────────────
  const { data: filieresData, isLoading: filieresLoading } = useQuery({
    queryKey: ['timetable-data-filieres'],
    queryFn: () => timetableDataApi.getFilieres(),
    staleTime: 10 * 60 * 1000,
  });
  const filieres: TimetableFiliere[] = Array.isArray(filieresData) ? filieresData : [];

  // ── Timetable data (JSON-based, by filière code) ───────────────────────────
  const { data: jsonTimetable, isLoading: jsonLoading, isError: jsonError } = useQuery({
    queryKey: ['timetable-data', filiereCode, weekStart],
    queryFn: () => timetableDataApi.getByFiliere({ filiere_code: filiereCode, week_start: weekStart }),
    enabled: !isStudent && filiereCode !== '',
    staleTime: 5 * 60 * 1000,
  });

  // ── Student timetable (DB-based, auto-scoped) ──────────────────────────────
  const { data: studentTimetable, isLoading: studentLoading, isError: studentError } = useQuery({
    queryKey: ['stagiaire-timetable', user?.id, weekStart],
    queryFn: () => stagiaireApi.timetable({ week_start: weekStart }),
    enabled: isStudent,
  });

  // ── Formateur timetable (DB-based, own sessions only) ─────────────────────
  const { data: formateurTimetable, isLoading: formateurLoading, isError: formateurError } = useQuery({
    queryKey: ['timetable', user?.id, 'formateur', weekStart],
    queryFn: () => timetableApi.mine({ week_start: weekStart }),
    enabled: isFormateur,
  });

  // ── Delete mutation (DB seances only) ─────────────────────────────────────
  const deleteMut = useMutation({
    mutationFn: (id: number) => timetableApi.remove(id),
    onMutate: (id) => setDeleting(id),
    onSuccess: () => {
      toast.success('Séance supprimée.');
      queryClient.invalidateQueries({ queryKey: ['timetable'] });
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err, 'Erreur lors de la suppression.')),
    onSettled: () => setDeleting(null),
  });

  // Performance: useCallback ensures stable references for memoized SeanceCard
  const handleDelete = useCallback((id: number) => {
    if (!window.confirm('Supprimer cette séance ?')) return;
    deleteMut.mutate(id);
  }, [deleteMut]);

  const handleEdit = useCallback((s: TimetableSeance) => {
    setEditingSeance(s);
    setDefaultDate(undefined);
    setModalOpen(true);
  }, []);

  const handleAddFromCell = useCallback((date: string) => {
    setEditingSeance(null);
    setDefaultDate(date);
    setModalOpen(true);
  }, []);

  const handleAdd = useCallback(() => {
    setEditingSeance(null);
    setDefaultDate(getMondayISO(new Date(weekStart)));
    setModalOpen(true);
  }, [weekStart]);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setEditingSeance(null);
  }, []);

  // ── Derived data (memoized to prevent recomputation) ────────────────────────
  const isLoading = isStudent
    ? studentLoading
    : isFormateur
      ? formateurLoading
      : (filiereCode !== '' ? jsonLoading : false);
  const isError = isStudent
    ? studentError
    : isFormateur
      ? formateurError
      : (filiereCode !== '' ? jsonError : false);

  // Performance: memoize expensive data derivation to avoid recomputation
  // on unrelated state changes (modal, deleting, viewMode).
  const { byDate, seances, effectiveWeekStart } = useMemo(() => {
    let byDate: Record<string, AnySeance[]> = {};
    let seances: AnySeance[] = [];
    let effectiveWeekStart = weekStart;

    if (isStudent && studentTimetable) {
      byDate = studentTimetable.by_date as Record<string, AnySeance[]>;
      seances = (studentTimetable.seances ?? []).slice().sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return (a.start_time ?? '').localeCompare(b.start_time ?? '');
      });
      effectiveWeekStart = studentTimetable.week_start || weekStart;
    } else if (isFormateur && formateurTimetable) {
      byDate = formateurTimetable.by_date as Record<string, AnySeance[]>;
      seances = (formateurTimetable.seances ?? []).slice().sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return (a.start_time ?? '').localeCompare(b.start_time ?? '');
      });
      effectiveWeekStart = formateurTimetable.week_start || weekStart;
    } else if (!isStudent && filiereCode && jsonTimetable) {
      byDate = jsonTimetable.by_date as Record<string, AnySeance[]>;
      seances = (jsonTimetable.schedules ?? []).slice();
      effectiveWeekStart = jsonTimetable.week_start || weekStart;
    }

    return { byDate, seances, effectiveWeekStart };
  }, [isStudent, isFormateur, studentTimetable, formateurTimetable, filiereCode, jsonTimetable, weekStart]);

  const isEmpty = !isLoading && !isError && seances.length === 0;

  // Performance: memoize weekDates array to prevent new reference each render
  const weekDates = useMemo(
    () => Array.from({ length: 6 }, (_, i) => addDays(effectiveWeekStart, i)),
    [effectiveWeekStart]
  );

  const displayedHours = useMemo(
    () => isFormateur
      ? Array.from(new Set(seances.map((s) => seanceStartHour(s)))).sort((a, b) => a - b)
      : HOURS,
    [isFormateur, seances]
  );

  // Performance: compute once, not on every render
  const todayISO = useMemo(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }, []);

  // Module code lookup from JSON data
  const moduleCode = (s: AnySeance): string | null => {
    if ('module' in s && s.module && typeof s.module === 'object') {
      const c = (s.module as { code?: string | null }).code;
      return c ?? null;
    }
    return null;
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Emploi du temps</h1>
          <p className="mt-0.5 text-sm text-slate-500">Planning hebdomadaire des séances</p>
        </div>
        {canEdit && (
          <Button onClick={handleAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Ajouter une séance
          </Button>
        )}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* View toggle */}
        <div className="flex rounded-xl border border-slate-200 bg-white p-0.5 shadow-sm">
          <button
            onClick={() => setViewMode('calendar')}
            className={`app-control-ghost flex items-center gap-1.5 px-3 py-1.5 font-medium ${
              viewMode === 'calendar'
                ? 'bg-primary-600 text-white shadow'
                : ''
            }`}
          >
            <Calendar className="h-4 w-4" />
            Calendrier
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`app-control-ghost flex items-center gap-1.5 px-3 py-1.5 font-medium ${
              viewMode === 'list'
                ? 'bg-primary-600 text-white shadow'
                : ''
            }`}
          >
            <List className="h-4 w-4" />
            Liste
          </button>
        </div>

        {/* Week navigation */}
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
          <button
            onClick={() => setWeekStart((w) => addDays(w, -7))}
            className="app-control-ghost p-0.5"
            title="Semaine précédente"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[180px] text-center text-sm font-medium text-slate-700">
            {weekDates[0]} → {weekDates[5]}
          </span>
          <button
            onClick={() => setWeekStart((w) => addDays(w, 7))}
            className="app-control-ghost p-0.5"
            title="Semaine suivante"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => setWeekStart(getMondayISO())}
            className="ml-1 rounded-lg border border-slate-200 px-2 py-0.5 text-xs text-slate-500 transition-colors duration-200 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
          >
            Aujourd'hui
          </button>
        </div>

        {/* Filière filter — shown for all roles */}
        {!isStudent && !isFormateur && (
          <div className="flex items-center gap-2">
            {filieresLoading ? (
              <div className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-400 shadow-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement...
              </div>
            ) : (
              <FiliereSelector
                filieres={filieres}
                value={filiereCode}
                onChange={setFiliereCode}
              />
            )}
          </div>
        )}
      </div>

      {/* ── Filière info banner ── */}
      {!isStudent && filiereCode && jsonTimetable?.filiere_label && (
        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3">
          <BookOpen className="h-5 w-5 shrink-0 text-indigo-500" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-indigo-800">
              {jsonTimetable.filiere_label}
            </p>
            <p className="text-sm text-indigo-600">
              {jsonTimetable.group_label && <span className="mr-3">{jsonTimetable.group_label}</span>}
              {jsonTimetable.academic_year && <span className="mr-3">A.S. {jsonTimetable.academic_year}</span>}
              {jsonTimetable.session && <span>Session {jsonTimetable.session}</span>}
            </p>
          </div>
          {jsonTimetable.modules.length > 0 && (
            <div className="text-sm text-indigo-600">
              <span className="font-medium">{jsonTimetable.modules.length}</span> modules
            </div>
          )}
        </div>
      )}

      {/* ── Content ── */}
      {!isStudent && !isFormateur && !filiereCode ? (
        /* Prompt to select a filière */
        <Card className="p-16 text-center">
          <BookOpen className="mx-auto mb-4 h-14 w-14 text-indigo-200" />
          <p className="text-lg font-semibold text-slate-700">Sélectionnez une filière</p>
          <p className="mt-1 text-sm text-slate-400">
            Choisissez une filière dans le menu ci-dessus pour afficher son emploi du temps.
          </p>
          {filieres.length > 0 && (
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {filieres.map((f) => (
                <button
                  key={f.code}
                  onClick={() => setFiliereCode(f.code)}
                  className="rounded-full border border-indigo-200 bg-white px-4 py-1.5 text-sm font-medium text-indigo-700 shadow-sm transition hover:bg-indigo-50"
                >
                  {f.code}
                </button>
              ))}
            </div>
          )}
        </Card>
      ) : isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      ) : isError ? (
        <Card className="border-rose-200 bg-rose-50 p-12 text-center">
          <p className="font-medium text-rose-700">Erreur de chargement de l'emploi du temps.</p>
          <p className="mt-1 text-sm text-rose-600">Vérifiez votre connexion ou réessayez plus tard.</p>
        </Card>
      ) : isEmpty ? (
        <Card className="p-16 text-center">
          <Calendar className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <p className="text-slate-500">Aucune séance pour cette semaine.</p>
          {isStudent && (
            <p className="mt-1 text-sm text-slate-400">
              Assurez-vous d'être inscrit dans un groupe lié à votre filière.
            </p>
          )}
          {canEdit && (
            <Button className="mt-4 gap-2" onClick={handleAdd}>
              <Plus className="h-4 w-4" />
              Ajouter la première séance
            </Button>
          )}
        </Card>
      ) : viewMode === 'calendar' ? (
        // ── Calendar Grid ──────────────────────────────────────────────────
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="w-16 border-r border-slate-200 p-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                  Heure
                </th>
                {weekDates.map((date, i) => (
                  <th
                    key={date}
                    className={`border-l border-slate-200 p-3 text-left ${date === todayISO ? 'bg-blue-50' : ''}`}
                  >
                    <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      {DAYS[i]}
                    </div>
                    <div
                      className={`mt-0.5 text-lg font-bold ${
                        date === todayISO ? 'text-blue-600' : 'text-slate-800'
                      }`}
                    >
                      {date.slice(8, 10)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayedHours.map((hour) => (
                <tr key={hour} className="border-b border-slate-100 last:border-b-0">
                  <td className="border-r border-slate-200 p-2 text-right text-xs text-slate-400">{hour}:00</td>
                  {weekDates.map((date) => {
                    const rows = (byDate[date] ?? []).filter(
                      (row: AnySeance) => seanceStartHour(row) === hour
                    );
                    return (
                      <td
                        key={date}
                        className="group/cell min-w-[150px] cursor-pointer border-l border-slate-200 p-1 align-top hover:bg-blue-50/30"
                        onClick={() => canEdit && rows.length === 0 && handleAddFromCell(date)}
                        title={
                          canEdit && rows.length === 0
                            ? 'Ajouter une séance'
                            : undefined
                        }
                      >
                        <div className="space-y-1">
                          {rows.map((s: AnySeance, idx: number) => (
                            <SeanceCard
                              key={seanceStableKey(s, idx)}
                              seance={s}
                              moduleCode={moduleCode(s)}
                              canEdit={canEdit}
                              onEdit={canEdit ? handleEdit : undefined}
                              onDelete={canEdit ? handleDelete : undefined}
                              deleting={deleting}
                              compact
                            />
                          ))}
                          {canEdit && rows.length === 0 && (
                            <div className="hidden rounded border-2 border-dashed border-blue-200 px-2 py-1 text-center text-xs text-blue-300 group-hover/cell:block">
                              + Ajouter
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : isStudent ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">Jour</th>
                  <th className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">Date</th>
                  <th className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">Début</th>
                  <th className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">Fin</th>
                  <th className="px-4 py-3 font-semibold text-slate-700 min-w-[140px]">Module</th>
                  <th className="px-4 py-3 font-semibold text-slate-700 min-w-[120px]">Formateur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {seances.map((s: AnySeance, idx: number) => {
                  const ts = s as TimetableSeance;
                  let jour =
                    typeof ts.jour === 'string' && ts.jour ? ts.jour : undefined;
                  if (!jour && ts.date) {
                    try {
                      jour = WEEKDAY_FR[new Date(`${ts.date}T12:00:00`).getDay()];
                    } catch {
                      jour = '—';
                    }
                  }
                  if (!jour) jour = '—';
                  const start = String('start_time' in s ? s.start_time : '').slice(0, 5);
                  const end = String('end_time' in s ? s.end_time : '').slice(0, 5);
                  return (
                    <tr key={seanceStableKey(s, idx)} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 text-slate-800 whitespace-nowrap">{jour}</td>
                      <td className="px-4 py-3 text-slate-600 font-mono text-xs whitespace-nowrap">
                        {ts.date}
                      </td>
                      <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{start}</td>
                      <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{end}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{seanceName(s)}</td>
                      <td className="px-4 py-3 text-slate-600">{teacherName(s) ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // ── List View (staff / formateur) ────────────────────────────────────
        <div className="space-y-6">
          {weekDates.map((date, di) => {
            const daySeances = byDate[date] ?? [];
            if (daySeances.length === 0) return null;
            return (
              <Card key={date} className="p-4 sm:p-5">
                <div className="mb-2 flex items-center gap-3">
                  <h2
                    className={`text-base font-bold ${
                      date === todayISO ? 'text-blue-600' : 'text-slate-800'
                    }`}
                  >
                    {DAYS[di]} {date}
                    {date === todayISO && (
                      <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-600">
                        Aujourd'hui
                      </span>
                    )}
                  </h2>
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs text-slate-400">{daySeances.length} séance(s)</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {daySeances.map((s: AnySeance, idx: number) => (
                    <SeanceCard
                      key={seanceStableKey(s, idx)}
                      seance={s}
                      moduleCode={moduleCode(s)}
                      canEdit={canEdit}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      deleting={deleting}
                    />
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Modal (DB seances only) ── */}
      <SeanceFormModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        editing={editingSeance}
        defaultDate={defaultDate}
      />
    </div>
  );
}

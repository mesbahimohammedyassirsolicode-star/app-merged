import { memo, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { modulesApi } from '../api/api/modules';
import type { AcademicCatalogFiliere, Module, MyModulesPayload } from '../api/api/modules';
import { stagiaireApi } from '../api/api/stagiaire';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import {
  Search, ChevronUp, BookOpen, Clock, FileWarning, Hash, Layers3,
  ClipboardList,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { getApiErrorMessage } from '../lib/api-error';

// Performance: pure component, no props — React.memo prevents re-render on parent updates
const SkeletonCard = memo(function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 bg-white overflow-hidden mb-4">
      <div className="flex items-center gap-3 px-6 py-5 bg-gray-50 border-b border-gray-100">
        <div className="h-9 w-9 rounded-lg bg-gray-200" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-56 bg-gray-200 rounded" />
          <div className="h-3 w-28 bg-gray-100 rounded" />
        </div>
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="px-6 py-4 border-b border-gray-100 last:border-0">
          <div className="h-4 w-52 bg-gray-200 rounded mb-2" />
          <div className="h-3 w-32 bg-gray-100 rounded" />
        </div>
      ))}
    </div>
  );
});

const TeacherModulesTableSkeleton = memo(function TeacherModulesTableSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden animate-pulse">
      <div className="h-12 bg-gray-50 border-b border-gray-100" />
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="px-4 py-4 border-b border-gray-100 flex gap-4">
          <div className="h-4 flex-1 bg-gray-200 rounded" />
          <div className="h-4 w-24 bg-gray-100 rounded" />
          <div className="h-4 w-40 bg-gray-100 rounded" />
        </div>
      ))}
    </div>
  );
});

function formatLastSession(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

function localDatetimeValueFromIso(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localDatetimeToIso(local: string): string | undefined {
  const t = local.trim();
  if (!t) return undefined;
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

const StagiaireModulesTableSkeleton = memo(function StagiaireModulesTableSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden animate-pulse">
      <div className="h-12 bg-gray-50 border-b border-gray-100" />
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="px-4 py-4 border-b border-gray-100 flex gap-4">
          <div className="h-4 flex-1 bg-gray-200 rounded" />
          <div className="h-4 w-48 bg-gray-100 rounded" />
        </div>
      ))}
    </div>
  );
});

/** Modules de la filière du stagiaire (API dédiée, lecture seule). */
function StagiaireModulesSection() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const query = useQuery({
    queryKey: ['stagiaire-modules', user?.id],
    queryFn: () => stagiaireApi.modules(),
    enabled: Boolean(user?.id),
  });

  useEffect(() => {
    if (query.error) {
      toast.error(getApiErrorMessage(query.error, 'Erreur lors du chargement des modules.'));
    }
  }, [query.error]);

  const emptyArray = useMemo(() => [], []);
  const rows = query.data?.modules ?? emptyArray;
  const metaFiliere = query.data?.meta?.filiere;

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((m) => {
      const desc = (m.description ?? '').toLowerCase();
      return m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q) || desc.includes(q);
    });
  }, [rows, searchQuery]);

  if (query.isLoading) {
    return <StagiaireModulesTableSkeleton />;
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[360px] rounded-2xl border-2 border-dashed border-gray-200 bg-white text-center py-16 px-6">
        <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
          <BookOpen className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Aucun module pour votre filière</h3>
        <p className="text-gray-500 max-w-md text-sm">
          Vérifiez que votre compte stagiaire est bien rattaché à une filière. Si le problème persiste,
          contactez le secrétariat.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {metaFiliere ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 font-medium text-indigo-800">
            Filière : {metaFiliere.code} — {metaFiliere.label}
          </span>
          <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-gray-600">
            {rows.length} module{rows.length !== 1 ? 's' : ''}
          </span>
        </div>
      ) : null}

      <div className="relative w-full sm:w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <Input
          placeholder="Filtrer par nom, code ou détail..."
          className="pl-9 pr-4 h-10 bg-white rounded-xl border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500/30"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left">
                <th className="px-4 py-3 font-semibold text-gray-700">Module</th>
                <th className="px-4 py-3 font-semibold text-gray-700 hidden md:table-cell">Code</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50/80">
                  <td className="px-4 py-3 font-medium text-gray-900">{m.name}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs hidden md:table-cell">{m.code}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {m.description ?? (
                      <span className="text-gray-400 italic">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filtered.length === 0 && rows.length > 0 ? (
        <p className="text-center text-sm text-gray-500">Aucun résultat pour cette recherche.</p>
      ) : null}
    </div>
  );
}

/** Modules assignés + progression (formateurs / enseignants). */
function FormateurModulesSection() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [drafts, setDrafts] = useState<
    Record<number, { progression: number; sessionLocal?: string }>
  >({});

  const query = useQuery({
    queryKey: ['my-modules', user?.id],
    queryFn: () => modulesApi.myModules(),
    enabled: Boolean(user?.id),
  });

  useEffect(() => {
    if (query.error) {
      toast.error(getApiErrorMessage(query.error, 'Erreur lors du chargement de vos modules.'));
    }
  }, [query.error]);

  const [prevModules, setPrevModules] = useState(query.data?.modules);

  if (query.data?.modules !== prevModules) {
    setPrevModules(query.data?.modules);
    const rows = query.data?.modules ?? [];
    setDrafts((prev) => {
      const next = { ...prev };
      for (const m of rows) {
        if (!next[m.id]) {
          next[m.id] = {
            progression: m.progress.progression,
            sessionLocal: localDatetimeValueFromIso(m.progress.last_session),
          };
        }
      }
      return next;
    });
  }

  const filteredModules = useMemo(() => {
    const rows = query.data?.modules ?? [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((m) => {
      const filiereLabel = m.filiere?.label?.toLowerCase() ?? '';
      return (
        m.label.toLowerCase().includes(q) ||
        m.code.toLowerCase().includes(q) ||
        filiereLabel.includes(q)
      );
    });
  }, [query.data?.modules, searchQuery]);

  const mutation = useMutation({
    mutationFn: ({
      moduleId,
      progression,
      last_session,
    }: {
      moduleId: number;
      progression: number;
      last_session?: string | null;
    }) =>
      modulesApi.updateModuleProgress(moduleId, {
        progression,
        last_session: last_session ?? undefined,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(
        ['my-modules', user?.id],
        (old: MyModulesPayload | undefined) => {
          if (!old) return old;
          return {
            ...old,
            modules: old.modules.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)),
          };
        },
      );
      setDrafts((prev) => ({
        ...prev,
        [updated.id]: {
          progression: updated.progress.progression,
          sessionLocal: localDatetimeValueFromIso(updated.progress.last_session),
        },
      }));
      toast.success('Progression enregistrée.');
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Impossible d’enregistrer la progression.'));
    },
  });

  const academicYear = query.data?.meta?.academic_year as number | undefined;

  if (query.isLoading) {
    return <TeacherModulesTableSkeleton />;
  }

  if ((query.data?.modules?.length ?? 0) === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[360px] rounded-2xl border-2 border-dashed border-gray-200 bg-white text-center py-16 px-6">
        <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
          <ClipboardList className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Aucun module assigné</h3>
        <p className="text-gray-500 max-w-md text-sm">
          {academicYear === 0 || academicYear === undefined
            ? 'Aucune année scolaire active n’a été trouvée. Vérifiez la configuration des années scolaires.'
            : 'Vous n’avez pas encore de modules pour l’année en cours. Les affectations sont gérées par l’administration.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {typeof academicYear === 'number' && academicYear > 0 && (
        <p className="text-xs text-gray-500">
          Année scolaire référencée (côté serveur) : <span className="font-medium text-gray-700">{academicYear}</span>
        </p>
      )}

      <div className="relative w-full sm:w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <Input
          placeholder="Filtrer par module, code ou filière..."
          className="pl-9 pr-4 h-10 bg-white rounded-xl border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500/30"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[720px]">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 font-semibold">Module</th>
                <th className="px-4 py-3 font-semibold">Filière</th>
                <th className="px-4 py-3 font-semibold w-[220px]">Progression</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Dernière séance</th>
                <th className="px-4 py-3 font-semibold w-[200px]">Mise à jour</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredModules.map((m) => {
                const draft = drafts[m.id] ?? {
                  progression: m.progress.progression,
                  sessionLocal: localDatetimeValueFromIso(m.progress.last_session),
                };
                const pct = draft.progression;
                const saving = mutation.isPending && mutation.variables?.moduleId === m.id;

                return (
                  <tr key={m.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="px-4 py-4 align-top">
                      <div className="font-semibold text-gray-900">{m.label}</div>
                      <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500">
                        {m.code ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                            <Hash className="h-3 w-3" />
                            {m.code}
                          </span>
                        ) : null}
                        {m.semester ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-sky-100 bg-sky-50 px-2 py-0.5 font-medium text-sky-700">
                            {m.semester}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top text-gray-700">
                      {m.filiere?.label ?? '—'}
                      {m.filiere?.code ? (
                        <span className="block text-xs text-gray-400 mt-0.5">{m.filiere.code}</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex items-center gap-3 mb-2">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={pct}
                          onChange={(e) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [m.id]: {
                                ...draft,
                                progression: Number(e.target.value),
                              },
                            }))
                          }
                          className="flex-1 h-2 accent-blue-600 cursor-pointer"
                          aria-label={`Progression ${m.label}`}
                        />
                        <span className="tabular-nums w-10 text-right font-medium text-gray-800">{pct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top text-gray-600 whitespace-nowrap">
                      {formatLastSession(m.progress.last_session)}
                    </td>
                    <td className="px-4 py-4 align-top space-y-2">
                      <Input
                        type="datetime-local"
                        className="h-9 text-xs"
                        value={draft.sessionLocal ?? ''}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [m.id]: { ...draft, sessionLocal: e.target.value },
                          }))
                        }
                      />
                      <p className="text-[11px] text-gray-400 leading-snug">
                        Laisser vide pour utiliser la date du serveur à l’enregistrement.
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        className="w-full sm:w-auto"
                        isLoading={saving}
                        onClick={() =>
                          mutation.mutate({
                            moduleId: m.id,
                            progression: draft.progression,
                            last_session: localDatetimeToIso(draft.sessionLocal ?? ''),
                          })
                        }
                      >
                        Enregistrer
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredModules.length === 0 && (query.data?.modules?.length ?? 0) > 0 ? (
        <p className="text-center text-sm text-gray-500 py-6">Aucun résultat pour cette recherche.</p>
      ) : null}
    </div>
  );
}

// Performance: React.memo prevents re-renders when parent search filter changes
// but this module's data hasn't changed
const ModuleRow = memo(function ModuleRow({ module }: { module: Module }) {
  return (
    <div className="group px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-blue-50/30 transition-colors duration-150">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h4 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors text-sm sm:text-base">
            {module.label}
          </h4>
          {module.code && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-full border border-indigo-100">
              <Hash className="h-3 w-3" />
              {module.code}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1 rounded-full border border-sky-100 bg-sky-50 px-2 py-0.5 font-medium text-sky-700">
            <Layers3 className="h-3.5 w-3.5" />
            {module.niveau ?? module.semester}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-gray-400" />
            {module.masse_horaire}h
          </span>
          <span className="flex items-center gap-1">
            <span className="font-semibold text-gray-600">Coef</span>
            {module.coefficient}
          </span>
        </div>
      </div>
    </div>
  );
});

// Performance: React.memo prevents re-render when sibling filiere cards are toggled
const FiliereCard = memo(function FiliereCard({ filiere }: { filiere: AcademicCatalogFiliere }) {
  const [open, setOpen] = useState(true);
  const filiereModules = useMemo(
    () => (Array.isArray(filiere.modules) ? filiere.modules : []),
    [filiere.modules]
  );

  const modulesByLevel = useMemo(() => {
    const map: Record<string, Module[]> = {};
    filiereModules.forEach((module) => {
      const key = module.niveau ?? module.semester ?? 'Autre';
      (map[key] ??= []).push(module);
    });
    return map;
  }, [filiereModules]);

  return (
    <Card className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <CardHeader
        className="!flex-row !space-y-0 items-center justify-between cursor-pointer px-5 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 hover:from-blue-50/40 transition-colors duration-200"
        onClick={() => setOpen((value) => !value)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-100 text-blue-600 flex-shrink-0">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-gray-900 leading-none">
              {filiere.label}
            </CardTitle>
            <p className="text-xs text-gray-500 mt-1">
              {filiere.code} • {filiere.type} • {filiereModules.length} module{filiereModules.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div
          className={`text-gray-400 transition-transform duration-300 ${open ? 'rotate-0' : 'rotate-180'}`}
        >
          <ChevronUp className="h-5 w-5" />
        </div>
      </CardHeader>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? 'max-h-[9999px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <CardContent className="p-5 space-y-5">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 font-medium text-gray-700">
              Niveau requis: {filiere.required_level}
            </span>
            <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 font-medium text-blue-700">
              Durée: {filiere.duration_years} an{filiere.duration_years > 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-4">
            {Object.entries(modulesByLevel).map(([level, modules]) => (
              <div key={level} className="rounded-xl border border-gray-100 bg-gray-50/60 overflow-hidden">
                <div className="border-b border-gray-100 px-4 py-3">
                  <h3 className="text-sm font-bold text-gray-900">{level}</h3>
                </div>
                <div className="divide-y divide-gray-100 bg-white">
                  {modules.map((module) => (
                    <ModuleRow key={module.id} module={module} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </div>
    </Card>
  );
});

export default function ModulesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const isTeacherScope = user?.role === 'teacher' || user?.role === 'formateur';
  const isStudentScope = user?.role === 'student' || user?.role === 'stagiaire';

  const { data: filieres = [], isLoading, error } = useQuery({
    queryKey: ['modules-academic-catalog', user?.id, user?.role],
    queryFn: () => modulesApi.academicCatalog(),
    enabled: Boolean(user?.id) && !isTeacherScope && !isStudentScope,
  });

  useEffect(() => {
    if (error) {
      toast.error(getApiErrorMessage(error, 'Erreur chargement des modules.'));
    }
  }, [error]);

  const filteredFilieres = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return filieres;

    return filieres.reduce<AcademicCatalogFiliere[]>((acc, filiere) => {
      const matchesFiliere =
        filiere.label.toLowerCase().includes(q) ||
        filiere.code.toLowerCase().includes(q) ||
        filiere.type.toLowerCase().includes(q);

      const sourceModules = Array.isArray(filiere.modules) ? filiere.modules : [];
      const modules = sourceModules.filter((module) =>
        module.label.toLowerCase().includes(q) ||
        module.code.toLowerCase().includes(q) ||
        (module.niveau ?? '').toLowerCase().includes(q)
      );

      if (matchesFiliere || modules.length > 0) {
        acc.push({
          ...filiere,
          modules: matchesFiliere ? sourceModules : modules,
        });
      }

      return acc;
    }, []);
  }, [filieres, searchQuery]);

  const totalModules = useMemo(
    () => filteredFilieres.reduce((sum, filiere) => sum + filiere.modules.length, 0),
    [filteredFilieres],
  );

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('nav.modules', 'Modules')}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isTeacherScope
              ? 'Modules qui vous sont assignés : suivez la progression pédagogique et la dernière séance enregistrée.'
              : isStudentScope
                ? 'Liste officielle des modules de votre filière (consultation uniquement).'
                : 'Modules chargés depuis le fichier académique, classés par filière et par niveau.'}
          </p>
        </div>

        {!isTeacherScope && !isStudentScope ? (
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input
              placeholder="Rechercher module, code, niveau ou filière..."
              className="pl-9 pr-4 h-10 bg-white rounded-xl border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500/30"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        ) : null}
      </div>

      {isTeacherScope ? (
        <FormateurModulesSection />
      ) : isStudentScope ? (
        <StagiaireModulesSection />
      ) : (
        <>
          {!isLoading && filteredFilieres.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
              <span className="px-3 py-1 bg-blue-50 text-blue-700 font-medium rounded-full border border-blue-100">
                {totalModules} module{totalModules !== 1 ? 's' : ''}
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-600 font-medium rounded-full border border-gray-200">
                {filteredFilieres.length} filière{filteredFilieres.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-4">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : filteredFilieres.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] rounded-2xl border-2 border-dashed border-gray-200 bg-white text-center py-16 px-6">
              <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
                <FileWarning className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Aucun module trouvé</h3>
              <p className="text-gray-500 max-w-md text-sm">
                {searchQuery
                  ? "Aucun résultat ne correspond à votre recherche dans academic.json."
                  : "Le fichier academic.json ne contient aucun module exploitable pour l'instant."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFilieres.map((filiere) => (
                <FiliereCard key={filiere.code} filiere={filiere} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

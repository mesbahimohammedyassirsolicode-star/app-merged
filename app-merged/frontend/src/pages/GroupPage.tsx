import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Loader2, Users, BookOpen, Calendar, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useAuth } from '../hooks/useAuth';
import { stagiaireApi } from '../api/api/stagiaire';
import { getApiErrorMessage } from '../lib/api-error';
import type { TimetableSeance } from '../api/api/timetable';

function mondayISO(d = new Date()): string {
  const x = new Date(d);
  const day = x.getDay();
  const diff = x.getDate() - (day === 0 ? 6 : day - 1);
  x.setDate(diff);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const dd = String(x.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function addWeeks(iso: string, delta: number): string {
  const dt = new Date(iso + 'T12:00:00');
  dt.setDate(dt.getDate() + delta * 7);
  return mondayISO(dt);
}

function displayRange(weekStart: string, weekEnd: string): string {
  if (!weekStart || !weekEnd) return '';
  try {
    const a = new Date(weekStart + 'T12:00:00');
    const b = new Date(weekEnd + 'T12:00:00');
    return `${a.toLocaleDateString('fr-FR')} — ${b.toLocaleDateString('fr-FR')}`;
  } catch {
    return `${weekStart} — ${weekEnd}`;
  }
}

function seanceLabel(s: TimetableSeance): string {
  if (s.subject) return s.subject;
  return s.module?.label ?? s.module?.code ?? 'Séance';
}

export default function GroupPage() {
  const { user } = useAuth();
  const [weekStart, setWeekStart] = useState(() => mondayISO());

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['stagiaire-group-overview', user?.id, weekStart],
    queryFn: () => stagiaireApi.groupOverview({ week_start: weekStart }),
    enabled: !!user && (user.role === 'stagiaire' || user.role === 'student'),
  });

  const sortedSeances = useMemo(() => {
    const list = data?.timetable?.seances ?? [];
    return [...list].sort((a, b) => {
      const da = String(a.date).localeCompare(String(b.date));
      if (da !== 0) return da;
      return String(a.start_time).localeCompare(String(b.start_time));
    });
  }, [data?.timetable?.seances]);

  useEffect(() => {
    if (error) toast.error(getApiErrorMessage(error, 'Impossible de charger votre groupe.'));
  }, [error]);

  const busy = isLoading || isFetching;
  const rangeLabel = displayRange(data?.timetable.week_start ?? '', data?.timetable.week_end ?? '');
  const noGroup = !busy && data && data.group === null;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">Mon groupe</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              {busy ? '…' : data?.group?.label ?? data?.group?.name ?? 'Groupe'}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {busy ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary-600" />
                  Chargement…
                </span>
              ) : data?.group?.filiere ? (
                <>
                  Filière :{' '}
                  <span className="font-medium text-slate-800">
                    {data.group.filiere.code} — {data.group.filiere.label}
                  </span>
                </>
              ) : (
                'Filière non renseignée.'
              )}
            </p>
          </div>
          {!noGroup && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="gap-1"
                onClick={() => setWeekStart((w) => addWeeks(w, -1))}
              >
                <ChevronLeft className="h-4 w-4" />
                Semaine préc.
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="gap-1"
                onClick={() => setWeekStart(mondayISO())}
              >
                Aujourd&apos;hui
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="gap-1"
                onClick={() => setWeekStart((w) => addWeeks(w, 1))}
              >
                Semaine suiv.
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </header>

      {noGroup && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium">Aucun groupe assigné</p>
            <p className="mt-1 text-sm text-amber-800/90">
              Votre profil stagiaire n&apos;est pas rattaché à un groupe. Contactez le secrétariat pour finaliser votre
              inscription.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-slate-200 shadow-sm lg:col-span-2">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Users className="h-5 w-5 text-primary-600" />
            <CardTitle className="text-lg">Membres du groupe</CardTitle>
          </CardHeader>
          <CardContent>
            {busy ? (
              <div className="flex justify-center py-12 text-slate-500">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : noGroup ? (
              <p className="py-6 text-center text-sm text-slate-500">—</p>
            ) : (data?.members?.length ?? 0) === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">Aucun autre membre listé pour ce groupe.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full min-w-[320px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Nom</th>
                      <th className="px-4 py-3">Email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data!.members.map((m) => (
                      <tr key={m.id} className="bg-white hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-medium text-slate-900">{m.name ?? '—'}</td>
                        <td className="px-4 py-3 text-slate-600">{m.email ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm lg:col-span-2">
          <CardHeader className="flex flex-col gap-1 pb-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary-600" />
              <CardTitle className="text-lg">Emploi du temps</CardTitle>
            </div>
            {!noGroup && rangeLabel && (
              <span className="text-xs font-medium text-slate-500">{rangeLabel}</span>
            )}
          </CardHeader>
          <CardContent>
            {busy ? (
              <div className="flex justify-center py-12 text-slate-500">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : noGroup ? (
              <p className="py-6 text-center text-sm text-slate-500">—</p>
            ) : sortedSeances.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">
                Aucune séance planifiée pour cette semaine.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Créneau</th>
                      <th className="px-4 py-3">Module</th>
                      <th className="px-4 py-3">Salle</th>
                      <th className="px-4 py-3">Intervenant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedSeances.map((s) => (
                      <tr key={s.id} className="bg-white hover:bg-slate-50/80">
                        <td className="whitespace-nowrap px-4 py-3 text-slate-800">{s.date}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                          {s.start_time?.slice(0, 5)} – {s.end_time?.slice(0, 5)}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">{seanceLabel(s)}</td>
                        <td className="px-4 py-3 text-slate-600">{s.salle ?? '—'}</td>
                        <td className="px-4 py-3 text-slate-600">{s.teacher?.name ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm lg:col-span-2">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <BookOpen className="h-5 w-5 text-primary-600" />
            <CardTitle className="text-lg">Modules</CardTitle>
          </CardHeader>
          <CardContent>
            {busy ? (
              <div className="flex justify-center py-12 text-slate-500">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : noGroup ? (
              <p className="py-6 text-center text-sm text-slate-500">—</p>
            ) : (data?.modules?.length ?? 0) === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">Aucun module pour cette filière ou ce groupe.</p>
            ) : (
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100">
                {data!.modules.map((mod) => (
                  <li key={mod.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">
                        <span className="text-primary-700">{mod.code}</span>
                        <span className="mx-2 text-slate-300">·</span>
                        {mod.name}
                      </p>
                      {mod.description && <p className="mt-1 text-sm text-slate-600">{mod.description}</p>}
                    </div>
                    {mod.semester != null && mod.semester !== '' && (
                      <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        S{mod.semester}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

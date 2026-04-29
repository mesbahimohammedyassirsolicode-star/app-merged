import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { seancesApi } from '../api/api/seances';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getApiErrorMessage } from '../lib/api-error';

export default function AttendancePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  /** Monday–Sunday of the current week (local), so timetable rows seeded for the week are not clipped. */
  const { dateFrom, dateTo } = useMemo(() => {
    const fmt = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };
    const now = new Date();
    const start = new Date(now);
    const dow = start.getDay();
    const toMonday = dow === 0 ? -6 : 1 - dow;
    start.setDate(start.getDate() + toMonday);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return { dateFrom: fmt(start), dateTo: fmt(end) };
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ['seances', user?.id, user?.role, dateFrom, dateTo],
    queryFn: () => seancesApi.list({ start_date: dateFrom, end_date: dateTo, per_page: 30 }),
  });

  // FIXED: useEffect to avoid calling toast on every render cycle
  useEffect(() => {
    if (error) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 403) {
        toast.error('Accès refusé — vous ne pouvez pas consulter cette liste de séances.');
      } else {
        toast.error(getApiErrorMessage(error, 'Erreur chargement des seances.'));
      }
    }
  }, [error]);

  // FIXED: Determine if user doesn't have access (teacher/student hit admin-only endpoint)
  const isAccessDenied = !!(error as { response?: { status?: number } } | null)?.response?.status &&
    (error as { response?: { status?: number } }).response?.status === 403;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('nav.attendance')}</h1>
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>
      ) : isAccessDenied ? (
        // FIXED: Show meaningful message instead of blank screen on 403
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-6 py-10 text-center">
          <p className="text-amber-800 font-semibold">Accès restreint</p>
          <p className="text-sm text-amber-700 mt-1">
            Vous n’avez pas accès à cette liste de séances. Les formateurs enregistrent les présences depuis{' '}
            <span className="font-medium">Présences</span> dans le menu (module, groupe et date).
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* FIXED: null-safe access and empty-state message */}
          {data?.items && data.items.length > 0 ? (
            data.items.map((s) => (
              <Card key={s.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{s.module?.label ?? s.affectation?.module?.label ?? 'Séance'}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600 space-y-2">
                  <p>{s.date} {s.start_time} — {s.end_time}</p>
                  <p>Groupe : {s.groupe?.label ?? s.affectation?.groupe?.label}</p>
                  <p className="capitalize">{s.status}</p>
                  <Button size="sm" onClick={() => navigate(`/attendance/seances/${s.id}`)}>
                    Appel
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            // FIXED: clear empty-state instead of blank screen
            !error && (
              <p className="text-gray-500 col-span-full text-center py-12">
                Aucune séance trouvée pour cette période.
              </p>
            )
          )}
        </div>
      )}
    </div>
  );
}

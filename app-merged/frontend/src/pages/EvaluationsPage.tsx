import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { evaluationsApi } from '../api/api/evaluations';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { getApiErrorMessage } from '../lib/api-error';

export default function EvaluationsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ['evaluations', user?.id, user?.role],
    queryFn: () => evaluationsApi.list({ per_page: 20 }),
  });

  useEffect(() => {
    if (error) toast.error(getApiErrorMessage(error, 'Erreur chargement des evaluations.'));
  }, [error]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-theme-text-primary">{t('nav.evaluations')}</h1>
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>
      ) : !data?.items?.length ? (
        <div className="rounded-xl border border-dashed border-theme-border glass-panel py-12 text-center text-sm text-theme-text-secondary">
          Aucune evaluation disponible.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data?.items?.map((e) => (
            <Card key={e.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{e.item_label}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-theme-text-secondary">
                <p>Type : {e.type} • Barème : {e.max_points}</p>
                <p>Date : {e.date}</p>
                <p>Module : {e.affectation?.module?.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

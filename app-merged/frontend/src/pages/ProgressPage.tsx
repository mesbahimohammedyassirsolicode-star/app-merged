import { useAuth } from '../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { progressApi } from '../api/api/progress';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getApiErrorMessage } from '../lib/api-error';

export default function ProgressPage() {
  const { user } = useAuth();
  const stagiaireId = user?.stagiaire?.id ?? user?.stagiaire?.id;

  const { data, isLoading, error } = useQuery({
    queryKey: ['progress', user?.id, user?.role, stagiaireId],
    queryFn: () => progressApi.get(stagiaireId!),
    enabled: !!stagiaireId,
  });

  useEffect(() => {
    if (error) toast.error(getApiErrorMessage(error, 'Erreur chargement de la progression.'));
  }, [error]);

  if (!stagiaireId) {
    return (
      <div className="p-6 text-theme-text-secondary">
        Cette page est réservée aux stagiaires (progression du syllabus par module).
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-theme-text-primary">Progression — Syllabus</h1>
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      ) : !data?.by_module?.length ? (
        <div className="rounded-xl border border-dashed border-theme-border glass-panel py-12 text-center text-sm text-theme-text-secondary">
          Aucune donnee de progression disponible.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data?.by_module?.map((m) => (
            <Card key={m.module_id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{m.module ?? `Module #${m.module_id}`}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-3 bg-theme-surface rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-600 rounded-full transition-all"
                      style={{ width: `${m.progress_percent}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{m.progress_percent}%</span>
                </div>
                <p className="text-xs text-theme-text-secondary mt-2">
                  {m.completed_count} / {m.total_count} éléments
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

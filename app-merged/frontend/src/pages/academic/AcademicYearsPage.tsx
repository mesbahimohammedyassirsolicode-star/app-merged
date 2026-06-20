import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { academicStructureApi } from '../../api/api/academicStructure';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import { getApiErrorMessage } from '../../lib/api-error';

export default function AcademicYearsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ['academic', 'years', user?.id, user?.role],
    queryFn: academicStructureApi.getYears,
  });

  useEffect(() => {
    if (error) toast.error(getApiErrorMessage(error, 'Erreur chargement des annees.'));
  }, [error]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-theme-text-primary">{t('nav.years')}</h1>
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      ) : !data?.length ? (
        <div className="rounded-xl border border-dashed border-theme-border glass-panel py-12 text-center text-sm text-theme-text-secondary">
          Aucune annee scolaire disponible.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data?.map((y) => (
            <Card key={y.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{y.label}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-theme-text-secondary">
                <p>{y.start_date} — {y.end_date}</p>
                {y.is_current && (
                  <span className="inline-block mt-2 px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-xs">
                    Année en cours
                  </span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

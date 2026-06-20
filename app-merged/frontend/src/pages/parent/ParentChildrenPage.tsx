import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { parentApi } from '../../api/api/parent';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import { getApiErrorMessage } from '../../lib/api-error';

export default function ParentChildrenPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ['parent', 'children', user?.id, user?.role],
    queryFn: parentApi.getChildren,
  });

  useEffect(() => {
    if (error) toast.error(getApiErrorMessage(error, 'Erreur chargement des enfants.'));
  }, [error]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-theme-text-primary">{t('nav.parentChildren')}</h1>
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>
      ) : !data?.length ? (
        <div className="rounded-xl border border-dashed border-theme-border glass-panel py-12 text-center text-sm text-theme-text-secondary">
          Aucun stagiaire lié pour le moment.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data?.map((c) => (
            <Card key={c.id} className="cursor-pointer hover:shadow-md transition" onClick={() => navigate(`/parent/children/${c.id}`)}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{c.user?.name ?? `Stagiaire #${c.id}`}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-theme-text-secondary">
                <p>CEF : {c.cef_number}</p>
                <p>Statut : {c.status}</p>
                {c.groupes?.length ? <p>Groupes : {c.groupes.map((g: { label: string }) => g.label).join(', ')}</p> : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

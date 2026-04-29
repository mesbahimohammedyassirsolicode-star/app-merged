import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { notificationsApi } from '../api/api/notifications';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { getApiErrorMessage } from '../lib/api-error';

export default function NotificationsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ['notifications', user?.id, user?.role],
    queryFn: () => notificationsApi.list({ per_page: 20 }),
  });

  useEffect(() => {
    if (error) {
      toast.error(getApiErrorMessage(error, 'Erreur chargement des notifications.'));
    }
  }, [error]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('nav.notifications')}</h1>
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>
      ) : (
        <div className="space-y-3">
          {data?.items?.length ? data.items.map((n) => (
            <Card key={n.id} className={n.read_at ? 'opacity-75' : ''}>
              <CardHeader className="pb-2">
                <p className="font-medium">{n.title || 'Notification'}</p>
                <p className="text-xs text-gray-500">{n.created_at || '-'}</p>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">{n.message || 'Aucun contenu.'}</CardContent>
            </Card>
          )) : (
            <p className="text-gray-500">Aucune notification.</p>
          )}
        </div>
      )}
    </div>
  );
}

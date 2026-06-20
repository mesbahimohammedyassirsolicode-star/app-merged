import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader } from '../../../components/ui/card';
import { getApiErrorMessage } from '../../../lib/api-error';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsList,
} from '../hooks/useNotifications';

type NotificationsListWidgetProps = {
  userId?: number | null;
};

export default function NotificationsListWidget({ userId }: NotificationsListWidgetProps) {
  const { data, isLoading, error } = useNotificationsList(userId, { per_page: 20 });
  const markRead = useMarkNotificationRead(userId);
  const markAllRead = useMarkAllNotificationsRead(userId);

  useEffect(() => {
    if (error) {
      toast.error(getApiErrorMessage(error, 'Erreur chargement des notifications.'));
    }
  }, [error]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-theme-text-secondary">Non lues: {data?.meta?.unread_count ?? 0}</p>
        <button
          type="button"
          className="rounded-lg border border-theme-border px-3 py-1 text-xs font-medium text-theme-text-primary hover:bg-theme-surface"
          onClick={() => markAllRead.mutate()}
          disabled={markAllRead.isPending}
        >
          Tout marquer comme lu
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      ) : (
        <div className="space-y-3">
          {data?.items?.length ? (
            data.items.map((notification) => (
              <Card key={notification.id} className={notification.read_at ? 'opacity-75' : ''}>
                <CardHeader className="pb-2">
                  <p className="font-medium">{notification.title || 'Notification'}</p>
                  <p className="text-xs text-theme-text-secondary">{notification.created_at || '-'}</p>
                </CardHeader>
                <CardContent className="text-sm text-theme-text-secondary">
                  <p>{notification.message || 'Aucun contenu.'}</p>
                  {!notification.read_at ? (
                    <button
                      type="button"
                      className="mt-3 rounded-md border border-indigo-300 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
                      onClick={() => markRead.mutate(notification.id)}
                      disabled={markRead.isPending}
                    >
                      Marquer comme lu
                    </button>
                  ) : null}
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-theme-text-secondary">Aucune notification.</p>
          )}
        </div>
      )}
    </div>
  );
}

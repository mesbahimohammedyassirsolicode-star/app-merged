import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import NotificationsListWidget from '../features/notifications/widgets/NotificationsListWidget';

export default function NotificationsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-theme-text-primary">{t('nav.notifications')}</h1>
      <NotificationsListWidget userId={user?.id} />
    </div>
  );
}

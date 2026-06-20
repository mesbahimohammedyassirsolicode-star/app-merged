import { memo } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { useAuth } from '../../../hooks/useAuth';
import { useUnreadNotificationsCount } from '../hooks/useNotifications';

function NotificationBellWidgetBase() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: unreadCount = 0 } = useUnreadNotificationsCount(user?.id);

  return (
    <Button
      variant="secondary"
      size="icon"
      onClick={() => navigate('/notifications')}
      aria-label="Open notifications"
      className="relative"
    >
      <Bell className="h-4 w-4" />
      {unreadCount > 0 ? (
        <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-rose-500 px-1 text-center text-[10px] font-semibold text-white">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      ) : null}
    </Button>
  );
}

const NotificationBellWidget = memo(NotificationBellWidgetBase);

export default NotificationBellWidget;

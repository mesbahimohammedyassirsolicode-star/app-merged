import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi, type NotificationsListResult } from '../../../api/api/notifications';
import { queryKeys } from '../../../lib/query-keys';

const UNREAD_POLLING_INTERVAL_MS = 30000;
const NOTIFICATIONS_PAGE_SIZE = 20;
const UNREAD_QUERY_PAGE_SIZE = 1;
const ANONYMOUS_USER_KEY = 'anonymous';

type NotificationListParams = {
  page?: number;
  per_page?: number;
};

type NotificationMutationContext = {
  previousEntries: Array<readonly [readonly unknown[], NotificationsListResult | undefined]>;
};

const toUserKey = (userId?: number | null) => userId ?? ANONYMOUS_USER_KEY;

const updateMarkReadInCache = (source: NotificationsListResult | undefined, notificationId: number) => {
  if (!source) {
    return source;
  }

  let changed = false;
  const items = source.items.map((item) => {
    if (item.id !== notificationId || item.read_at) {
      return item;
    }

    changed = true;
    return {
      ...item,
      read_at: new Date().toISOString(),
    };
  });

  if (!changed) {
    return source;
  }

  return {
    ...source,
    items,
    meta: {
      ...source.meta,
      unread_count: Math.max(0, source.meta.unread_count - 1),
    },
  };
};

const updateMarkAllReadInCache = (source: NotificationsListResult | undefined) => {
  if (!source) {
    return source;
  }

  let changed = false;
  const items = source.items.map((item) => {
    if (item.read_at) {
      return item;
    }

    changed = true;
    return {
      ...item,
      read_at: new Date().toISOString(),
    };
  });

  if (!changed && source.meta.unread_count === 0) {
    return source;
  }

  return {
    ...source,
    items,
    meta: {
      ...source.meta,
      unread_count: 0,
    },
  };
};

export function useNotificationsList(userId?: number | null, params?: NotificationListParams) {
  const userKey = toUserKey(userId);
  const queryParams = {
    page: params?.page ?? 1,
    per_page: params?.per_page ?? NOTIFICATIONS_PAGE_SIZE,
  };

  return useQuery({
    queryKey: queryKeys.notifications.list(userKey, queryParams),
    queryFn: () => notificationsApi.list(queryParams),
    enabled: Boolean(userId),
  });
}

export function useUnreadNotificationsCount(userId?: number | null) {
  const userKey = toUserKey(userId);

  return useQuery({
    queryKey: queryKeys.notifications.unread(userKey),
    queryFn: () => notificationsApi.list({ page: 1, per_page: UNREAD_QUERY_PAGE_SIZE }),
    enabled: Boolean(userId),
    refetchInterval: UNREAD_POLLING_INTERVAL_MS,
    refetchIntervalInBackground: true,
    select: (response: NotificationsListResult) => response.meta.unread_count ?? 0,
  });
}

export function useMarkNotificationRead(userId?: number | null) {
  const queryClient = useQueryClient();
  const userKey = toUserKey(userId);
  const userScopeKey = queryKeys.notifications.userScope(userKey);

  return useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onMutate: async (id: number): Promise<NotificationMutationContext> => {
      await queryClient.cancelQueries({ queryKey: userScopeKey });
      const previousEntries = queryClient.getQueriesData<NotificationsListResult>({ queryKey: userScopeKey });

      queryClient.setQueriesData<NotificationsListResult>({ queryKey: userScopeKey }, (current) =>
        updateMarkReadInCache(current, id)
      );

      return { previousEntries };
    },
    onError: (_error, _variables, context) => {
      if (!context) {
        return;
      }

      for (const [key, value] of context.previousEntries) {
        queryClient.setQueryData(key, value);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: userScopeKey });
    },
  });
}

export function useMarkAllNotificationsRead(userId?: number | null) {
  const queryClient = useQueryClient();
  const userKey = toUserKey(userId);
  const userScopeKey = queryKeys.notifications.userScope(userKey);

  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onMutate: async (): Promise<NotificationMutationContext> => {
      await queryClient.cancelQueries({ queryKey: userScopeKey });
      const previousEntries = queryClient.getQueriesData<NotificationsListResult>({ queryKey: userScopeKey });

      queryClient.setQueriesData<NotificationsListResult>({ queryKey: userScopeKey }, (current) =>
        updateMarkAllReadInCache(current)
      );

      return { previousEntries };
    },
    onError: (_error, _variables, context) => {
      if (!context) {
        return;
      }

      for (const [key, value] of context.previousEntries) {
        queryClient.setQueryData(key, value);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: userScopeKey });
    },
  });
}

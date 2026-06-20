import api from '../../lib/axios';
import { unwrapData, unwrapMeta, type ApiResponse } from '../../lib/api';

export interface Notification {
  id: number;
  title: string;
  message: string;
  type?: string | null;
  data?: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
}

export interface NotificationsMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  unread_count: number;
}

export interface NotificationsListResult {
  items: Notification[];
  meta: NotificationsMeta;
}

export const notificationsApi = {
  list: (params?: { page?: number; per_page?: number }) =>
    api.get<ApiResponse<Notification[]>>('/notifications', { params }).then((res): NotificationsListResult => ({
      items: unwrapData(res),
      meta: unwrapMeta(res) as NotificationsMeta,
    })),
  markRead: (id: number) => api.post<ApiResponse<Notification>>(`/notifications/${id}/read`).then(unwrapData),
  markAllRead: () => api.post<ApiResponse<{ marked: boolean }>>('/notifications/read-all').then(unwrapData),
};

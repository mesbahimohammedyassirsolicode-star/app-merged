import api from '../../lib/axios';
import { unwrapData, unwrapMeta, type ApiResponse } from '../../lib/api';

export interface Notification {
  id: number;
  title: string;
  message: string;
  read_at: string | null;
  created_at: string;
}

export const notificationsApi = {
  list: (params?: { page?: number; per_page?: number }) =>
    api.get<ApiResponse<Notification[]>>('/notifications', { params }).then((res) => ({
      items: unwrapData(res),
      meta: unwrapMeta(res),
    })),
  markRead: (id: number) => api.post<ApiResponse<Notification>>(`/notifications/${id}/read`).then(unwrapData),
};

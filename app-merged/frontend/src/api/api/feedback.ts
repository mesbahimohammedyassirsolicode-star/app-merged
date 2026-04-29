import api from '../../lib/axios';
import { unwrapData, unwrapMeta, type ApiResponse } from '../../lib/api';

export interface Feedback {
  id: number;
  category: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export const feedbackApi = {
  list: (params?: { page?: number; per_page?: number }) =>
    api.get<ApiResponse<Feedback[]>>('/feedbacks', { params }).then((res) => ({
      items: unwrapData(res),
      meta: unwrapMeta(res),
    })),
  submit: (body: { category: string; content: string; submission_token?: string }) =>
    api.post<ApiResponse<{ message: string }>>('/feedbacks', body).then(unwrapData),
};

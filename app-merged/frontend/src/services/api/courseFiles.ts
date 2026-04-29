import api from '../../lib/axios';
import { unwrapData, type ApiResponse } from '../../lib/api';

export interface CourseFile {
  id: number;
  title: string | null;
  description: string | null;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  groupe_id: number | null;
  module_id: number | null;
  groupe?: { id: number; label: string; filiere?: { id: number; name: string; label: string; } };
  module?: { id: number; code: string; label: string; filiere?: { id: number; name: string; label: string; } };
  uploader?: { id: number; name: string };
  created_at: string;
  updated_at: string;
}

export interface CourseFilesListResult {
  items: CourseFile[];
  meta: { current_page: number; last_page: number; per_page: number; total: number };
}

function parseListResponse(res: { data?: unknown }): CourseFilesListResult {
  const body = res.data as {
    success?: boolean;
    data?: CourseFile[];
    meta?: Record<string, number>;
  };
  const items = Array.isArray(body?.data) ? body.data : [];
  const m = body?.meta ?? {};
  return {
    items,
    meta: {
      current_page: typeof m.current_page === 'number' ? m.current_page : 1,
      last_page: typeof m.last_page === 'number' ? m.last_page : 1,
      per_page: typeof m.per_page === 'number' ? m.per_page : 20,
      total: typeof m.total === 'number' ? m.total : items.length,
    },
  };
}

export const courseFilesApi = {
  list: async (params?: {
    groupe_id?: number;
    module_id?: number;
    page?: number;
    per_page?: number;
  }): Promise<CourseFilesListResult> => {
    const res = await api.get('/course-files', { params });
    return parseListResponse(res);
  },

  upload: async (payload: {
    file: File;
    filiere_id: number;
    module_id: number;
    title?: string;
    description?: string;
  }): Promise<CourseFile> => {
    const form = new FormData();
    form.append('file', payload.file);
    form.append('filiere_id', String(payload.filiere_id));
    form.append('module_id', String(payload.module_id));
    if (payload.title) form.append('title', payload.title);
    if (payload.description) form.append('description', payload.description);

    const res = await api.post<ApiResponse<CourseFile>>('/course-files', form, {
      transformRequest: [(data, headers) => {
        const h = headers as import('axios').AxiosRequestHeaders | undefined;
        if (h && typeof h.delete === 'function') {
          h.delete('Content-Type');
        }
        return data;
      }],
    });
    return unwrapData(res);
  },

  download: async (id: number): Promise<{ blob: Blob; filename: string }> => {
    const res = await api.get(`/course-files/${id}/download`, { responseType: 'blob' });
    const cd = res.headers['content-disposition'] as string | undefined;
    let filename = `fichier-${id}`;
    if (cd) {
      const utf = /filename\*=UTF-8''([^;\n]+)/i.exec(cd);
      if (utf) {
        filename = decodeURIComponent(utf[1].trim());
      } else {
        const quoted = /filename="([^"]+)"/i.exec(cd);
        const plain = /filename=([^;\n]+)/i.exec(cd);
        const raw = quoted?.[1] ?? plain?.[1];
        if (raw) filename = raw.trim().replace(/^["']|["']$/g, '');
      }
    }
    return { blob: res.data as Blob, filename };
  },

  delete: (id: number) => api.delete(`/course-files/${id}`),
};

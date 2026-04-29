import api from '../../lib/axios';
import { unwrapData, type ApiResponse } from '../../lib/api';

export interface Groupe {
  id: number;
  niveau_id?: number;
  filiere_id: number;
  annee_scolaire_id: number;
  name?: string;
  label: string;
  year_level: number;
  capacity: number;
  students_count?: number;
  filiere?: { id: number; label: string; code: string };
  annee_scolaire?: { id: number; label: string };
  anneeScolaire?: { id: number; label: string };
  stagiaires?: { id: number; user?: { id: number; name: string } | null }[];
}

export interface GroupsListResponse {
  items: Groupe[];
  meta: { current_page: number; last_page: number; per_page: number; total: number };
}

function normalizeGroupsList(res: { data?: ApiResponse<Groupe[]> | Groupe[] | { data?: Groupe[]; total?: number; current_page?: number; last_page?: number; per_page?: number } }): { items: Groupe[]; meta: { current_page: number; last_page: number; per_page: number; total: number } } {
  const raw = (res as { data?: unknown }).data;
  let items: Groupe[] = [];
  const meta = { current_page: 1, last_page: 1, per_page: 15, total: 0 };

  if (raw != null && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.data)) {
      items = o.data as Groupe[];
      if (typeof o.current_page === 'number') meta.current_page = o.current_page;
      if (typeof o.last_page === 'number') meta.last_page = o.last_page;
      if (typeof o.per_page === 'number') meta.per_page = o.per_page;
      if (typeof o.total === 'number') meta.total = o.total;
    } else if (Array.isArray(raw)) {
      items = raw as Groupe[];
    }
    const m = (raw as { meta?: Record<string, number> })?.meta;
    if (m && typeof m === 'object') {
      if (typeof m.current_page === 'number') meta.current_page = m.current_page;
      if (typeof m.last_page === 'number') meta.last_page = m.last_page;
      if (typeof m.per_page === 'number') meta.per_page = m.per_page;
      if (typeof m.total === 'number') meta.total = m.total;
    }
  }
  return { items, meta };
}

export const groupsApi = {
  list: async (params?: { filiere_id?: number; niveau_id?: number; year_id?: number; page?: number; per_page?: number }) => {
    const res = await api.get<ApiResponse<Groupe[]>>('/groups', { params });
    return normalizeGroupsList(res);
  },
  get: (id: number) => api.get<ApiResponse<Groupe>>(`/groups/${id}`).then(unwrapData),
  create: (body: { filiere_id: number; annee_scolaire_id: number; label: string; year_level: number; capacity?: number }) =>
    api.post<ApiResponse<Groupe>>('/groups', body).then(unwrapData),
  update: (id: number, body: Partial<Groupe>) =>
    api.put<ApiResponse<Groupe>>(`/groups/${id}`, body).then(unwrapData),
  delete: (id: number) => api.delete(`/groups/${id}`),
  enroll: (groupId: number, stagiaireIds: number[]) =>
    api.post<ApiResponse<{ message: string }>>(`/groups/${groupId}/enroll`, { stagiaire_ids: stagiaireIds }).then(unwrapData),
};

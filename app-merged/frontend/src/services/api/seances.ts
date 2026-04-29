import api from '../../lib/axios';
import { unwrapData, unwrapMeta, type ApiResponse } from '../../lib/api';

export interface Seance {
  id: number;
  affectation_id: number;
  date: string;
  start_time: string;
  end_time: string;
  salle?: string;
  status: string;
  type: string;
  module?: { label: string; code?: string };
  groupe?: { label: string };
  affectation?: { module?: { label: string }; groupe?: { label: string }; formateur?: { user?: { name: string } } };
}

export interface RollCallRow {
  stagiaire: { id: number; user?: { name: string } };
  attendance?: { id: number; status: string; retard_minutes: number };
  status: string;
}

export const seancesApi = {
  list: (params?: { groupe_id?: number; start_date?: string; end_date?: string; page?: number; per_page?: number }) =>
    api.get<ApiResponse<Seance[]>>('/seances', { params }).then((res) => ({
      items: unwrapData(res),
      meta: unwrapMeta(res),
    })),
  get: (id: number) => api.get<ApiResponse<Seance>>(`/seances/${id}`).then(unwrapData),
  create: (body: { affectation_id: number; date: string; start_time: string; end_time: string; salle?: string; type?: string }) =>
    api.post<ApiResponse<Seance>>('/seances', body).then(unwrapData),
  update: (id: number, body: Partial<Seance>) =>
    api.put<ApiResponse<Seance>>(`/seances/${id}`, body).then(unwrapData),
  delete: (id: number) => api.delete(`/seances/${id}`),
  getRollCall: (id: number) => api.get<ApiResponse<RollCallRow[]>>(`/seances/${id}/roll-call`).then(unwrapData),
  submitRollCall: (id: number, attendances: { stagiaire_id: number; status: string; retard_minutes?: number; justifie?: boolean; motif?: string }[]) =>
    api.post<ApiResponse<{ message: string }>>(`/seances/${id}/roll-call`, { attendances }).then(unwrapData),
};

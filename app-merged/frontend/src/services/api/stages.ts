import api from '../../lib/axios';
import { unwrapData, unwrapMeta, type ApiResponse } from '../../lib/api';

export interface Stage {
  id: number;
  stagiaire_id: number;
  groupe_id?: number;
  formateur_id?: number;
  organisation: string;
  poste?: string;
  date_debut: string;
  date_fin: string;
  status: string;
  note?: number;
  observation?: string;
  stagiaire?: { user?: { name: string } };
  groupe?: { label: string };
  formateur?: { user?: { name: string } };
}

export const stagesApi = {
  list: (params?: { stagiaire_id?: number; groupe_id?: number; status?: string; page?: number; per_page?: number }) =>
    api.get<ApiResponse<Stage[]>>('/stages', { params }).then((res) => ({
      items: unwrapData(res),
      meta: unwrapMeta(res),
    })),
  get: (id: number) => api.get<ApiResponse<Stage>>(`/stages/${id}`).then(unwrapData),
  create: (body: Partial<Stage> & { stagiaire_id: number; organisation: string; date_debut: string; date_fin: string }) =>
    api.post<ApiResponse<Stage>>('/stages', body).then(unwrapData),
  update: (id: number, body: Partial<Stage>) =>
    api.put<ApiResponse<Stage>>(`/stages/${id}`, body).then(unwrapData),
  delete: (id: number) => api.delete(`/stages/${id}`),
};

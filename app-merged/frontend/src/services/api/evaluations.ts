import api from '../../lib/axios';
import { unwrapData, unwrapMeta, type ApiResponse } from '../../lib/api';

export interface Evaluation {
  id: number;
  affectation_id: number;
  item_label: string;
  type: 'cc' | 'efm' | 'projet' | 'stage';
  max_points: number;
  coefficient: number;
  date: string;
  affectation?: { module?: { label: string }; groupe?: { label: string } };
}

export interface NoteRow {
  stagiaire: { id: number; user?: { name: string } };
  note?: { id: number; valeur: number; observation?: string };
  max_points: number;
}

export const evaluationsApi = {
  list: (params?: { affectation_id?: number; page?: number; per_page?: number }) =>
    api.get<ApiResponse<Evaluation[]>>('/evaluations', { params }).then((res) => ({
      items: unwrapData(res),
      meta: unwrapMeta(res),
    })),
  get: (id: number) => api.get<ApiResponse<Evaluation>>(`/evaluations/${id}`).then(unwrapData),
  getNotes: (id: number) => api.get<ApiResponse<NoteRow[]>>(`/evaluations/${id}/notes`).then(unwrapData),
  saveNotes: (id: number, notes: { stagiaire_id: number; valeur: number; observation?: string }[]) =>
    api.post<ApiResponse<{ message: string }>>(`/evaluations/${id}/notes`, { notes }).then(unwrapData),
  create: (body: {
    affectation_id: number;
    item_label: string;
    type: string;
    max_points: number;
    coefficient: number;
    date: string;
  }) => api.post<ApiResponse<Evaluation>>('/evaluations', body).then(unwrapData),
  update: (id: number, body: Partial<Evaluation>) =>
    api.put<ApiResponse<Evaluation>>(`/evaluations/${id}`, body).then(unwrapData),
  delete: (id: number) => api.delete(`/evaluations/${id}`),
};

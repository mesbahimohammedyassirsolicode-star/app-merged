import api from '../../lib/axios';
import { unwrapData, type ApiResponse } from '../../lib/api';

export interface Affectation {
  id: number;
  formateur_id: number;
  groupe_id: number;
  module_id: number;
  annee_scolaire_id: number;
  start_date?: string;
  end_date?: string;
  formateur?: { id: number; user?: { name: string } };
  groupe?: { id: number; label: string };
  module?: { id: number; label: string; code: string };
  annee_scolaire?: { id: number; label: string };
}

export const affectationsApi = {
  list: (params?: { formateur_id?: number; groupe_id?: number }) =>
    api.get<ApiResponse<Affectation[]>>('/affectations', { params }).then(unwrapData),
  get: (id: number) => api.get<ApiResponse<Affectation>>(`/affectations/${id}`).then(unwrapData),
  create: (body: {
    formateur_id: number;
    groupe_id: number;
    module_id: number;
    annee_scolaire_id: number;
    start_date?: string;
    end_date?: string;
  }) => api.post<ApiResponse<Affectation>>('/affectations', body).then(unwrapData),
  update: (id: number, body: Partial<Affectation>) =>
    api.put<ApiResponse<Affectation>>(`/affectations/${id}`, body).then(unwrapData),
  delete: (id: number) => api.delete(`/affectations/${id}`),
};

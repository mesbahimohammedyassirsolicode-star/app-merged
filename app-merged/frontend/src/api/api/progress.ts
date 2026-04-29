import api from '../../lib/axios';
import { unwrapData, type ApiResponse } from '../../lib/api';

export interface ProgressByModule {
  module_id: number;
  module?: string;
  completed_count: number;
  total_count: number;
  progress_percent: number;
}

export interface ProgressResponse {
  stagiaire_id: number;
  by_module: ProgressByModule[];
}

export const progressApi = {
  get: (stagiaireId: number, params?: { annee_scolaire_id?: number }) =>
    api.get<ApiResponse<ProgressResponse>>(`/stagiaires/${stagiaireId}/progress`, { params }).then(unwrapData),
};

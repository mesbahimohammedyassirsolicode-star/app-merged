import api from '../../lib/axios';
import { unwrapData, type ApiResponse } from '../../lib/api';

export interface GradesSummaryRow {
  stagiaire_id: number;
  stagiaire: { id: number; user?: { name: string } };
  evaluations: { evaluation_id: number; type: string; item_label: string; valeur: number; max_points: number; coefficient: number; normalized_over_20: number }[];
  module_average_over_20: number;
}

export interface StagiaireGradesSummary {
  stagiaire: { id: number; user?: { name: string } };
  affectation: { id: number; module?: { label: string } };
  evaluations: { evaluation_id: number; type: string; item_label: string; valeur: number; max_points: number; normalized_over_20: number }[];
  module_average_over_20: number;
}

export const gradesSummaryApi = {
  summaryByAffectation: (affectationId: number) =>
    api.get<ApiResponse<GradesSummaryRow[]>>(`/affectations/${affectationId}/grades-summary`).then(unwrapData),
  summaryByStagiaire: (stagiaireId: number, params: { affectation_id: number }) =>
    api.get<ApiResponse<StagiaireGradesSummary>>(`/stagiaires/${stagiaireId}/grades-summary`, { params }).then(unwrapData),
};

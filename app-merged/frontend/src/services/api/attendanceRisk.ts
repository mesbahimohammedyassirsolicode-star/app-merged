import api from '../../lib/axios';
import { unwrapData, type ApiResponse } from '../../lib/api';

export interface AttendanceSummaryRow {
  stagiaire_id: number;
  stagiaire: { id: number; user?: { name: string } };
  by_affectation: { affectation_id: number; module?: string; rate_percent: number; present_count: number; total_count: number; is_risk: boolean }[];
  global_rate_percent: number;
  is_risk: boolean;
  can_sit_exam: boolean;
}

export interface StagiaireAttendanceSummary {
  stagiaire_id: number;
  stagiaire: { id: number; user?: { name: string } };
  by_affectation: { affectation_id: number; module?: string; rate_percent: number; is_risk: boolean }[];
  global_rate_percent: number;
  is_risk: boolean;
  can_sit_exam: boolean;
  threshold_percent: number;
}

export const attendanceRiskApi = {
  summaryByGroup: (groupId: number, params?: { annee_scolaire_id?: number }) =>
    api.get<ApiResponse<AttendanceSummaryRow[]>>(`/groups/${groupId}/attendance-summary`, { params }).then(unwrapData),
  summaryByStagiaire: (stagiaireId: number, params: { annee_scolaire_id: number }) =>
    api.get<ApiResponse<StagiaireAttendanceSummary>>(`/stagiaires/${stagiaireId}/attendance-summary`, { params }).then(unwrapData),
};

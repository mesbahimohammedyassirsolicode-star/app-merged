import api from '../../lib/axios';
import { unwrapData, type ApiResponse } from '../../lib/api';

export interface AnalyticsFilters {
  module_id?: number;
  group_id?: number;
  date_from?: string;
  date_to?: string;
}

export interface AnalyticsOverview {
  kpis: {
    total_students: number;
    active_modules: number;
    attendance_rate: number;
    average_grade: number;
  };
  charts: {
    grade_distribution: { bucket: string; count: number }[];
    progress_over_time: { period: string; avg_grade: number }[];
    attendance_trends: { period: string; attendance_rate: number; absent_count: number }[];
  };
  ai: {
    at_risk_students: {
      student_id: number;
      student_name: string;
      average_grade: number;
      attendance_rate: number;
      risk_score: number;
      risk_level: 'low' | 'medium' | 'high';
      prediction: 'pass' | 'fail';
      explanation: string;
      recommendations: string[];
    }[];
    recommendations: string[];
  };
}

export const analyticsApi = {
  overview: (filters?: AnalyticsFilters) =>
    api
      .get<ApiResponse<AnalyticsOverview>>('/analytics/overview', { params: filters })
      .then(unwrapData),
};

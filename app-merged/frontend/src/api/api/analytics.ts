import api from '../../lib/axios';
import { unwrapData, type ApiResponse } from '../../lib/api';
import type { AnalyticsFiltersContract, AnalyticsOverviewContract } from '../../features/analytics/contracts';

export type AnalyticsFilters = AnalyticsFiltersContract;
export type AnalyticsOverview = AnalyticsOverviewContract;

export interface AnalyticsStructuredQueryRequest {
  metric: 'attendance_rate' | 'absence_count' | 'average_grade' | 'pass_rate';
  dimension: 'day' | 'week' | 'month' | 'group' | 'module' | 'student';
  filters?: Pick<AnalyticsFiltersContract, 'date_from' | 'date_to' | 'module_id' | 'group_id'>;
}

export interface AnalyticsStructuredQueryRow {
  label: string;
  attendance_rate?: number;
  avg_grade?: number;
  count?: number;
}

export interface AnalyticsStructuredQueryResponse {
  metric: string;
  dimension: string;
  rows: AnalyticsStructuredQueryRow[];
  chart: {
    type: string;
    labels: string[];
    data: number[];
  };
}

export const analyticsApi = {
  overview: (filters?: AnalyticsFilters) =>
    api
      .get<ApiResponse<AnalyticsOverview>>('/analytics/overview', { params: filters })
      .then(unwrapData),

  structuredQuery: (body: AnalyticsStructuredQueryRequest) =>
    api.post<ApiResponse<AnalyticsStructuredQueryResponse>>('/analytics/query', body).then(unwrapData),
};

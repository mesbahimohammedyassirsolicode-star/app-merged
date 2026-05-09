import api from '../../lib/axios';
import { unwrapData, type ApiResponse } from '../../lib/api';

export type AiChartType = 'bar' | 'line' | 'pie';

export interface AiChartPayload {
  type: AiChartType;
  labels: string[];
  data: number[];
}

export interface AiAssistantResponse {
  intent: 'students_at_risk' | 'average_performance' | 'top_students' | 'attendance_report' | 'grades_by_module';
  data: unknown;
  chart?: AiChartPayload;
  summary: string;
  insights: string[];
  recommendations: string[];
  meta?: {
    intent_source?: 'llm' | 'rule';
    applied_filters?: Record<string, unknown>;
  };
}

export interface AiAssistantExportRequest {
  format: 'pdf' | 'csv';
  data: unknown;
  summary: string;
  insights: string[];
}

export const aiAssistantApi = {
  ask: (query: string) =>
    api
      .post<ApiResponse<AiAssistantResponse>>('/ai/assistant', { query })
      .then(unwrapData),
  export: async (payload: AiAssistantExportRequest): Promise<void> => {
    const res = await api.post('/ai/export', payload, { responseType: 'blob' });
    const type = payload.format === 'pdf' ? 'pdf' : 'csv';
    const url = URL.createObjectURL(res.data as Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-assistant-export.${type}`;
    a.click();
    URL.revokeObjectURL(url);
  },
};

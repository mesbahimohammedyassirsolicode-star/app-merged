import api from '../../lib/axios';
import { unwrapData, type ApiResponse } from '../../lib/api';

export type AiChartType = 'bar' | 'line' | 'pie' | 'scatter' | 'heatmap';

export interface AiChartPayload {
  type: AiChartType;
  labels: string[];
  data: number[];
  series?: { key: string; label: string }[];
}

export interface CopilotInsight {
  title: string;
  detail: string;
}

export interface CopilotRecommendation {
  type: string;
  label: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface AiAssistantResponse {
  conversation_id?: string;
  message_id?: string;
  intent:
    | 'students_at_risk'
    | 'average_performance'
    | 'top_students'
    | 'attendance_report'
    | 'grades_by_module';
  data: unknown;
  chart?: AiChartPayload;
  charts?: AiChartPayload[];
  summary: string;
  insights: string[] | CopilotInsight[];
  recommendations: string[] | CopilotRecommendation[];
  follow_up_suggestions?: string[];
  scope?: {
    type: string;
    masked: boolean;
  };
  meta?: {
    intent_source?: 'llm' | 'rule';
    applied_filters?: Record<string, unknown>;
    trace_id?: string;
    cache_hit?: boolean;
    generated_at?: string;
    plan?: {
      intent_family?: string;
      filters?: Record<string, unknown>;
      dimensions?: string[];
      metrics?: string[];
      chart_type?: string;
    };
  };
}

type AiAssistantMeta = NonNullable<AiAssistantResponse['meta']>;
type AiAssistantMetaPlan = NonNullable<AiAssistantMeta['plan']>;

export interface AiAssistantExportRequest {
  format: 'pdf' | 'csv';
  data: unknown;
  summary: string;
  insights: string[];
}

export interface AnalyticsCatalogResponse {
  metrics: Record<string, {
    label: string;
    description: string;
    roles: string[];
    default_chart: AiChartType;
    cache_ttl: number;
    supported_dimensions: string[];
  }>;
  dimensions: Record<string, { label: string }>;
}

export interface StructuredAnalyticsQueryRequest {
  metric: string;
  dimension: string;
  filters?: {
    date_from?: string;
    date_to?: string;
  };
}

export interface StructuredAnalyticsQueryResponse {
  metric: string;
  dimension: string;
  rows: Array<Record<string, unknown>>;
  chart: AiChartPayload;
}

export const aiAssistantApi = {
  ask: (query: string, conversationId?: string) =>
    api
      .post<ApiResponse<AiAssistantResponse>>('/analytics/copilot/query', {
        query,
        conversation_id: conversationId,
      })
      .then((res) => {
        const payload = unwrapData(res) as unknown as Record<string, unknown>;
        const intent = payload.intent as Record<string, unknown> | undefined;
        const meta = payload.meta as Record<string, unknown> | undefined;
        const plan = meta?.plan as AiAssistantMetaPlan | undefined;

        return {
          conversation_id: payload.conversation_id as string | undefined,
          message_id: payload.message_id as string | undefined,
          intent: (intent?.name as AiAssistantResponse['intent'] | undefined) ?? 'average_performance',
          data: payload.data,
          chart: Array.isArray(payload.charts) ? (payload.charts[0] as AiChartPayload | undefined) : undefined,
          charts: Array.isArray(payload.charts) ? (payload.charts as AiChartPayload[]) : undefined,
          summary: (payload.summary as string | undefined) ?? '',
          insights: (payload.insights as AiAssistantResponse['insights'] | undefined) ?? [],
          recommendations: (payload.recommendations as AiAssistantResponse['recommendations'] | undefined) ?? [],
          follow_up_suggestions: (payload.follow_up_suggestions as string[] | undefined) ?? [],
          scope: payload.scope as AiAssistantResponse['scope'] | undefined,
          meta: {
            intent_source: (intent?.source as 'llm' | 'rule' | undefined) ?? 'rule',
            applied_filters: plan?.filters,
            trace_id: meta?.trace_id as string | undefined,
            cache_hit: meta?.cache_hit as boolean | undefined,
            generated_at: meta?.generated_at as string | undefined,
            plan,
          },
        } satisfies AiAssistantResponse;
      }),
  catalog: () =>
    api
      .get<ApiResponse<AnalyticsCatalogResponse>>('/analytics/catalog')
      .then(unwrapData),
  structuredQuery: (payload: StructuredAnalyticsQueryRequest) =>
    api
      .post<ApiResponse<StructuredAnalyticsQueryResponse>>('/analytics/query', payload)
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

// ── Copilot API Types ─────────────────────────────────────────────────────────

export interface CopilotInsight {
  title: string;
  detail: string;
  severity: 'critical' | 'warning' | 'positive' | 'neutral';
}

export interface CopilotRecommendation {
  label: string;
  priority: 'high' | 'medium' | 'low';
  type: 'pedagogical' | 'administrative' | 'corrective';
}

export interface CopilotRiskAlert {
  title: string;
  level: 'high' | 'medium' | 'low';
  description: string;
}

export interface CopilotChartDataset {
  label: string;
  data: number[];
}

export interface CopilotChart {
  type: 'bar' | 'pie' | 'line' | 'area';
  title: string;
  labels: string[];
  datasets: CopilotChartDataset[];
}

export interface CopilotQueryResponse {
  session_id: number;
  intent: string;
  agent: string;
  summary: string;
  insights: CopilotInsight[];
  recommendations: CopilotRecommendation[];
  risk_alerts: CopilotRiskAlert[];
  chart: CopilotChart | null;
  data: Record<string, unknown>;
  source: 'gemini' | 'deterministic';
  follow_up_suggestions: string[];
}

export interface CopilotSession {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface CopilotMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  payload: {
    intent?: string;
    agent?: string;
    insights?: CopilotInsight[];
    recommendations?: CopilotRecommendation[];
    risk_alerts?: CopilotRiskAlert[];
    chart?: CopilotChart | null;
    source?: string;
  } | null;
  created_at: string;
}

export interface CopilotInsightsSummary {
  risk_alerts: CopilotRiskAlert[];
  at_risk_count: number;
  risk_summary: {
    failure: number;
    dropout: number;
    attendance: number;
    performance: number;
  };
  insights: CopilotInsight[];
}

// ── UI State Types ────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  payload?: CopilotQueryResponse;
}

export type CopilotTab = 'chat' | 'insights' | 'recommendations' | 'reports' | 'analytics' | 'trends' | 'alerts';

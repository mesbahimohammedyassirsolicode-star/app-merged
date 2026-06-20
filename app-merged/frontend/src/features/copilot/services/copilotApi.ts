import api from '../../../lib/axios';
import type {
  CopilotQueryResponse,
  CopilotSession,
  CopilotMessage,
  CopilotInsightsSummary,
} from '../types/copilot';

interface ApiWrapper<T> {
  success: boolean;
  data: T;
}

export const copilotApi = {
  /** Send a query to the AI Copilot */
  query: (query: string, sessionId?: number | null) =>
    api
      .post<ApiWrapper<CopilotQueryResponse>>('/copilot/query', {
        query,
        session_id: sessionId ?? null,
      })
      .then((r) => r.data.data),

  /** List chat sessions */
  sessions: () =>
    api
      .get<ApiWrapper<{ sessions: CopilotSession[] }>>('/copilot/sessions')
      .then((r) => r.data.data.sessions),

  /** Get messages for a session */
  messages: (sessionId: number) =>
    api
      .get<ApiWrapper<{ messages: CopilotMessage[] }>>(`/copilot/sessions/${sessionId}/messages`)
      .then((r) => r.data.data.messages),

  /** Delete a session */
  deleteSession: (sessionId: number) =>
    api.delete(`/copilot/sessions/${sessionId}`).then((r) => r.data),

  /** Get auto-generated insights */
  insights: () =>
    api
      .get<ApiWrapper<CopilotInsightsSummary>>('/copilot/insights')
      .then((r) => r.data.data),
};

import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BrainCircuit, Database, Download, Loader2, MessageSquareText, ShieldCheck, Sparkles } from 'lucide-react';
import {
  aiAssistantApi,
  type AiAssistantResponse,
  type AiChartPayload,
  type AnalyticsCatalogResponse,
  type StructuredAnalyticsQueryResponse,
} from '../../api/api/aiAssistant';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { getApiErrorMessage } from '../../lib/api-error';

type ChatItem = {
  id: string;
  query: string;
  response?: AiAssistantResponse;
  error?: string;
};

const SUGGESTED_QUERIES = [
  'Show students at risk in my scope this month',
  'Compare attendance with last month',
  'Which modules have the lowest grades?',
  'Show top students in my groups',
  'Explain the attendance trend this year',
];

function normalizeInsightText(insight: AiAssistantResponse['insights'][number]): string {
  return typeof insight === 'string' ? insight : `${insight.title}: ${insight.detail}`;
}

function normalizeRecommendationText(recommendation: AiAssistantResponse['recommendations'][number]): string {
  return typeof recommendation === 'string' ? recommendation : recommendation.label;
}

function DataTable({ data }: { data: unknown }) {
  if (!Array.isArray(data) || data.length === 0 || typeof data[0] !== 'object' || data[0] === null) {
    return (
      <div className="rounded-2xl border border-theme-border bg-theme-surface p-4 text-sm text-theme-text-secondary">
        No drilldown table is available for this result yet.
      </div>
    );
  }

  const rows = data as Record<string, unknown>[];
  const columns = Object.keys(rows[0]).slice(0, 6);

  return (
    <div className="overflow-x-auto rounded-2xl border border-theme-border">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-theme-surface text-theme-text-secondary">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-4 py-3 font-semibold">
                {column.replaceAll('_', ' ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 12).map((row, index) => (
            <tr key={index} className="border-t border-theme-border">
              {columns.map((column) => (
                <td key={column} className="px-4 py-3 text-theme-text-primary">
                  {String(row[column] ?? '-')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AnalyticsChart({ chart }: { chart?: AiChartPayload }) {
  if (!chart || chart.labels.length === 0 || chart.data.length === 0) {
    return null;
  }

  const chartData = chart.labels.map((label, index) => ({
    label,
    value: Number(chart.data[index] ?? 0),
    x: index + 1,
  }));

  if (chart.type === 'line') {
    return (
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--theme-border))" />
            <XAxis dataKey="label" tick={{ fill: 'rgb(var(--theme-text-secondary))', fontSize: 12 }} />
            <YAxis tick={{ fill: 'rgb(var(--theme-text-secondary))', fontSize: 12 }} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#0f766e" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (chart.type === 'scatter') {
    return (
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--theme-border))" />
            <XAxis type="number" dataKey="x" name="index" tick={{ fill: 'rgb(var(--theme-text-secondary))', fontSize: 12 }} />
            <YAxis type="number" dataKey="value" name="value" tick={{ fill: 'rgb(var(--theme-text-secondary))', fontSize: 12 }} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter data={chartData} fill="#0f766e" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData.slice(0, 12)}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--theme-border))" />
          <XAxis dataKey="label" tick={{ fill: 'rgb(var(--theme-text-secondary))', fontSize: 12 }} />
          <YAxis tick={{ fill: 'rgb(var(--theme-text-secondary))', fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="value" fill="#0f766e" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function CatalogPanel({
  catalog,
  structuredResult,
  metric,
  dimension,
  onMetricChange,
  onDimensionChange,
  onRunStructuredQuery,
  isRunning,
}: {
  catalog?: AnalyticsCatalogResponse;
  structuredResult?: StructuredAnalyticsQueryResponse;
  metric: string;
  dimension: string;
  onMetricChange: (value: string) => void;
  onDimensionChange: (value: string) => void;
  onRunStructuredQuery: () => void;
  isRunning: boolean;
}) {
  const selectedMetric = metric && catalog ? catalog.metrics[metric] : undefined;
  const dimensionOptions = selectedMetric?.supported_dimensions ?? Object.keys(catalog?.dimensions ?? {});

  return (
    <Card className="border-theme-border glass-panel/90">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Database className="h-5 w-5 text-teal-700" />
          Analytics Builder
        </CardTitle>
        <CardDescription>Run secure metric queries without leaving role-scoped boundaries.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-theme-text-secondary">Metric</label>
          <select
            value={metric}
            onChange={(e) => onMetricChange(e.target.value)}
            className="w-full rounded-xl border border-theme-border glass-panel px-3 py-2 text-sm text-theme-text-primary"
          >
            {Object.entries(catalog?.metrics ?? {}).map(([key, value]) => (
              <option key={key} value={key}>
                {value.label}
              </option>
            ))}
          </select>
          {selectedMetric ? <p className="text-xs text-theme-text-secondary">{selectedMetric.description}</p> : null}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-theme-text-secondary">Dimension</label>
          <select
            value={dimension}
            onChange={(e) => onDimensionChange(e.target.value)}
            className="w-full rounded-xl border border-theme-border glass-panel px-3 py-2 text-sm text-theme-text-primary"
          >
            {dimensionOptions.map((key) => (
              <option key={key} value={key}>
                {catalog?.dimensions[key]?.label ?? key}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={onRunStructuredQuery}
          disabled={isRunning || !metric || !dimension}
          className="w-full rounded-xl bg-theme-hover-card-bg px-4 py-2 text-sm font-semibold text-theme-hover-card-fg disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRunning ? 'Running query...' : 'Run structured query'}
        </button>

        {structuredResult ? (
          <div className="space-y-3 rounded-2xl border border-theme-border bg-theme-surface p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-theme-text-secondary">
              Latest builder result
            </p>
            <AnalyticsChart chart={structuredResult.chart} />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default function AiAssistant() {
  const [query, setQuery] = useState('');
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [history, setHistory] = useState<ChatItem[]>([]);
  const [metric, setMetric] = useState('attendance_rate');
  const [dimension, setDimension] = useState('month');
  const [structuredResult, setStructuredResult] = useState<StructuredAnalyticsQueryResponse | undefined>();

  const catalogQuery = useQuery({
    queryKey: ['analytics-catalog'],
    queryFn: () => aiAssistantApi.catalog(),
  });

  const askMutation = useMutation({
    mutationFn: (payload: { q: string; conversationId?: string }) => aiAssistantApi.ask(payload.q, payload.conversationId),
    onSuccess: (response, payload) => {
      setConversationId(response.conversation_id ?? payload.conversationId);
      setHistory((prev) => [...prev, { id: crypto.randomUUID(), query: payload.q, response }]);
    },
    onError: (error, payload) => {
      setHistory((prev) => [
        ...prev,
        { id: crypto.randomUUID(), query: payload.q, error: getApiErrorMessage(error, 'Unable to generate analytics response.') },
      ]);
    },
  });

  const structuredQueryMutation = useMutation({
    mutationFn: () => aiAssistantApi.structuredQuery({ metric, dimension }),
    onSuccess: (response) => setStructuredResult(response),
  });

  const exportMutation = useMutation({
    mutationFn: ({ format, response }: { format: 'pdf' | 'csv'; response: AiAssistantResponse }) =>
      aiAssistantApi.export({
        format,
        data: response.data,
        summary: response.summary,
        insights: response.insights.map(normalizeInsightText),
      }),
  });

  const canSend = useMemo(() => query.trim().length >= 3 && !askMutation.isPending, [query, askMutation.isPending]);

  const handleSend = (nextQuery?: string) => {
    const normalized = (nextQuery ?? query).trim();
    if (normalized.length < 3 || askMutation.isPending) {
      return;
    }
    setQuery('');
    askMutation.mutate({ q: normalized, conversationId });
  };

  const latestResponse = history.length > 0 ? history[history.length - 1].response : undefined;

  return (
    <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
      <CatalogPanel
        catalog={catalogQuery.data}
        structuredResult={structuredResult}
        metric={metric}
        dimension={dimension}
        onMetricChange={(value) => {
          setMetric(value);
          const supported = catalogQuery.data?.metrics[value]?.supported_dimensions ?? [];
          if (supported.length > 0 && !supported.includes(dimension)) {
            setDimension(supported[0]);
          }
        }}
        onDimensionChange={setDimension}
        onRunStructuredQuery={() => structuredQueryMutation.mutate()}
        isRunning={structuredQueryMutation.isPending}
      />

      <div className="space-y-6">
        <Card className="overflow-hidden border-theme-border bg-theme-card">
          <CardHeader className="pb-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl bg-teal-100 p-3 text-teal-800">
                <BrainCircuit className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>Analytics Copilot Workspace</CardTitle>
                <CardDescription>
                  Conversational, secure, role-scoped analytics for grades, attendance, trends, and student risk.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUERIES.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setQuery(item)}
                  className="rounded-full border border-teal-200 glass-panel/80 px-3 py-1.5 text-xs font-semibold text-teal-800"
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="rounded-3xl border border-theme-border glass-panel/90 p-3 shadow-sm">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask a question like: Which students in my groups are likely to fail this month, and why?"
                rows={4}
                className="w-full resize-none border-0 bg-transparent text-sm text-theme-text-primary outline-none"
              />
              <div className="mt-3 flex items-center justify-between gap-3 border-t border-theme-border pt-3">
                <div className="flex items-center gap-2 text-xs text-theme-text-secondary">
                  <ShieldCheck className="h-4 w-4 text-teal-700" />
                  Results stay role scoped and query-safe
                </div>
                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={!canSend}
                  className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {askMutation.isPending ? 'Analyzing...' : 'Ask Copilot'}
                </button>
              </div>
            </div>

            {askMutation.isPending ? (
              <div className="flex items-center gap-2 rounded-2xl border border-theme-border glass-panel px-4 py-3 text-sm text-theme-text-secondary">
                <Loader2 className="h-4 w-4 animate-spin" />
                Building analytics plan, applying secure scope, and generating insights...
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {history.slice().reverse().map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquareText className="h-4 w-4 text-teal-700" />
                  {item.query}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {item.error ? (
                  <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-400">
                    {item.error}
                  </div>
                ) : null}

                {item.response ? (
                  <>
                    <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
                      <div className="rounded-2xl bg-theme-hover-card-bg p-5 text-theme-hover-card-fg">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-200">Executive summary</p>
                        <p className="mt-2 text-base font-medium leading-7">{item.response.summary}</p>
                        <div className="mt-4 flex flex-wrap gap-2 text-xs text-theme-text-primary">
                          <span className="rounded-full glass-panel/10 px-3 py-1">
                            Intent: {item.response.intent.replaceAll('_', ' ')}
                          </span>
                          {item.response.scope?.type ? (
                            <span className="rounded-full glass-panel/10 px-3 py-1">
                              Scope: {item.response.scope.type.replaceAll('_', ' ')}
                            </span>
                          ) : null}
                          {item.response.meta?.cache_hit ? (
                            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-emerald-100">
                              cache hit
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-theme-border bg-theme-surface p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-theme-text-secondary">AI trace</p>
                        <div className="mt-3 space-y-2 text-sm text-theme-text-primary">
                          <p>Source: {item.response.meta?.intent_source ?? 'rule'}</p>
                          <p>Trace: {item.response.meta?.trace_id ?? 'n/a'}</p>
                          <p>Generated: {item.response.meta?.generated_at ?? 'n/a'}</p>
                        </div>
                      </div>
                    </div>

                    <AnalyticsChart chart={item.response.chart ?? item.response.charts?.[0]} />
                    <DataTable data={item.response.data} />

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-theme-border bg-theme-surface p-4">
                        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-theme-text-secondary">
                          <Sparkles className="h-4 w-4 text-teal-700" />
                          Insights
                        </p>
                        <ul className="mt-3 space-y-2 text-sm text-theme-text-primary">
                          {item.response.insights.map((insight) => (
                            <li key={normalizeInsightText(insight)}>{normalizeInsightText(insight)}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-500/10 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Recommendations</p>
                        <ul className="mt-3 space-y-2 text-sm text-emerald-900">
                          {item.response.recommendations.map((recommendation) => (
                            <li key={normalizeRecommendationText(recommendation)}>
                              {normalizeRecommendationText(recommendation)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => exportMutation.mutate({ format: 'pdf', response: item.response! })}
                        className="inline-flex items-center gap-2 rounded-xl border border-theme-border px-3 py-2 text-sm font-semibold text-theme-text-primary"
                      >
                        <Download className="h-4 w-4" />
                        Export PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => exportMutation.mutate({ format: 'csv', response: item.response! })}
                        className="inline-flex items-center gap-2 rounded-xl border border-theme-border px-3 py-2 text-sm font-semibold text-theme-text-primary"
                      >
                        <Download className="h-4 w-4" />
                        Export CSV
                      </button>
                      {item.response.follow_up_suggestions?.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => handleSend(suggestion)}
                          className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Session Context</CardTitle>
            <CardDescription>Follow-up prompts reuse secure conversational context.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-theme-text-secondary">
            <div className="rounded-2xl bg-theme-surface p-4">
              <p className="font-semibold text-theme-text-primary">Conversation</p>
              <p className="mt-1 break-all">{conversationId ?? 'A conversation id will appear after the first answer.'}</p>
            </div>
            <div className="rounded-2xl bg-theme-surface p-4">
              <p className="font-semibold text-theme-text-primary">Active scope</p>
              <p className="mt-1">{latestResponse?.scope?.type?.replaceAll('_', ' ') ?? 'Waiting for first response'}</p>
            </div>
            <div className="rounded-2xl bg-theme-surface p-4">
              <p className="font-semibold text-theme-text-primary">Plan snapshot</p>
              <p className="mt-1">
                Metrics: {latestResponse?.meta?.plan?.metrics?.join(', ') ?? 'n/a'}
              </p>
              <p className="mt-1">
                Dimensions: {latestResponse?.meta?.plan?.dimensions?.join(', ') ?? 'n/a'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Production Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-theme-text-secondary">
            <p>The copilot uses a role-aware execution plan rather than direct LLM-to-SQL generation.</p>
            <p>Structured queries and conversational answers share the same secure analytics scope model.</p>
            <p>Use the builder on the left for deterministic metric exploration and the chat for guided insight generation.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

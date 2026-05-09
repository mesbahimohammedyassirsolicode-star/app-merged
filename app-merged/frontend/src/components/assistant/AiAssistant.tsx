import { useMemo, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { BarChart, Bar, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Download, Loader2, Mic, MicOff, Sparkles } from 'lucide-react';
import { aiAssistantApi, type AiAssistantResponse } from '../../api/api/aiAssistant';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { getApiErrorMessage } from '../../lib/api-error';

type ChatItem = {
  id: string;
  query: string;
  response?: AiAssistantResponse;
  error?: string;
};

type SpeechRecognitionResultEvent = Event & {
  results: SpeechRecognitionResultList;
};

type SpeechRecognitionErrorEvent = Event & {
  error: string;
};

type SpeechRecognitionInstance = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

const SUGGESTED_QUERIES = [
  'Show me students at risk this month',
  'Average performance this month',
  'Top students in my scope',
  'Attendance report last 6 months',
  'Grades by module',
];

function DataTable({ data }: { data: unknown }) {
  if (!Array.isArray(data) || data.length === 0 || typeof data[0] !== 'object' || data[0] === null) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
        Structured table unavailable for this result.
      </div>
    );
  }

  const rows = data as Record<string, unknown>[];
  const columns = Object.keys(rows[0]).slice(0, 6);

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full text-left text-xs">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            {columns.map((col) => (
              <th key={col} className="px-3 py-2 font-semibold">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 10).map((row, idx) => (
            <tr key={idx} className="border-t border-slate-200">
              {columns.map((col) => (
                <td key={col} className="px-3 py-2 text-slate-700">{String(row[col] ?? '-')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DataChart({ response }: { response: AiAssistantResponse }) {
  if (!response.chart || response.chart.labels.length === 0 || response.chart.data.length === 0) {
    return null;
  }

  const chartData = response.chart.labels.map((label, index) => ({
    label,
    value: Number(response.chart?.data[index] ?? 0),
  }));

  if (response.chart.type === 'line') {
    return (
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} />
            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (response.chart.type === 'pie') {
    return (
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip />
            <Pie data={chartData} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={90}>
              {chartData.map((entry, index) => (
                <Cell key={`${entry.label}-${index}`} fill={['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444'][index % 5]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="h-60">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData.slice(0, 12)}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} />
          <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function AiAssistant() {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<ChatItem[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const debounceRef = useRef<number | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const askMutation = useMutation({
    mutationFn: (q: string) => aiAssistantApi.ask(q),
    onSuccess: (response, submittedQuery) => {
      setHistory((prev) => [...prev, { id: crypto.randomUUID(), query: submittedQuery, response }]);
    },
    onError: (error, submittedQuery) => {
      setHistory((prev) => [
        ...prev,
        { id: crypto.randomUUID(), query: submittedQuery, error: getApiErrorMessage(error, 'Unable to fetch analytics insight.') },
      ]);
    },
  });

  const exportMutation = useMutation({
    mutationFn: ({ format, response }: { format: 'pdf' | 'csv'; response: AiAssistantResponse }) =>
      aiAssistantApi.export({
        format,
        data: response.data,
        summary: response.summary,
        insights: response.insights,
      }),
  });

  const canSend = useMemo(() => query.trim().length >= 3 && !askMutation.isPending, [query, askMutation.isPending]);
  const supportsVoice = useMemo(() => {
    const scopedWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };

    return Boolean(scopedWindow.SpeechRecognition || scopedWindow.webkitSpeechRecognition);
  }, []);

  const debouncedAsk = (value: string) => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }
    debounceRef.current = window.setTimeout(() => {
      askMutation.mutate(value);
    }, 300);
  };

  const onSend = () => {
    const normalized = query.trim();
    if (normalized.length < 3 || askMutation.isPending) {
      return;
    }
    setQuery('');
    debouncedAsk(normalized);
  };

  const toggleVoiceInput = () => {
    if (!supportsVoice) {
      setVoiceError('Voice input is not supported on this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const scopedWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    const SpeechRecognitionImpl = scopedWindow.SpeechRecognition ?? scopedWindow.webkitSpeechRecognition;
    if (!SpeechRecognitionImpl) {
      setVoiceError('Voice input is not supported on this browser.');
      return;
    }

    const recognition = new SpeechRecognitionImpl();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim() ?? '';
      if (transcript.length > 0) {
        setQuery(transcript);
      }
      setVoiceError(null);
    };
    recognition.onerror = (event) => {
      setVoiceError(`Voice input error: ${event.error}`);
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    setVoiceError(null);
    setIsListening(true);
    recognition.start();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            Analytics Copilot
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">Ask analytics questions in natural language. Responses are structured and role-scoped.</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUERIES.map((s) => (
              <button
                key={s}
                type="button"
                className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => setQuery(s)}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Show me students at risk this month"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring-2"
            />
            <button
              type="button"
              onClick={toggleVoiceInput}
              disabled={!supportsVoice}
              className="rounded-lg border border-slate-300 px-3 py-2 text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              title={supportsVoice ? 'Voice input' : 'Voice input not supported'}
            >
              {isListening ? <MicOff className="h-4 w-4 text-rose-600" /> : <Mic className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={onSend}
              disabled={!canSend}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              Send
            </button>
          </div>
          {askMutation.isPending ? (
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Copilot is analyzing your data...
            </div>
          ) : null}
          {voiceError ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              {voiceError}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="space-y-4">
        {history.slice().reverse().map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <CardTitle className="text-base">Query: {item.query}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {item.error ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{item.error}</div>
              ) : null}
              {item.response ? (
                <>
                  <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-indigo-800">Summary</p>
                    <p className="mt-1 text-sm font-medium text-indigo-900">{item.response.summary}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-wide text-indigo-700">
                      Intent source: {item.response.meta?.intent_source ?? 'rule'}
                    </p>
                  </div>
                  <DataChart response={item.response} />
                  <DataTable data={item.response.data} />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => exportMutation.mutate({ format: 'pdf', response: item.response! })}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Export PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => exportMutation.mutate({ format: 'csv', response: item.response! })}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Export CSV
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">Insights</p>
                      <ul className="mt-2 space-y-1 text-xs text-slate-700">
                        {item.response.insights.map((insight) => (
                          <li key={insight}>- {insight}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Recommendations</p>
                      <ul className="mt-2 space-y-1 text-xs text-emerald-800">
                        {item.response.recommendations.map((recommendation) => (
                          <li key={recommendation}>- {recommendation}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

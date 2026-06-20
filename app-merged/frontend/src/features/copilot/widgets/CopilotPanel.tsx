import { useMemo, useState, useRef, useEffect } from 'react';
import { 
  AlertTriangle, BarChart3, Lightbulb, Loader2, Sparkles, 
  Send, Paperclip, Copy, Trash2, PanelLeft, Plus, 
  Bot, User, ChevronDown, Check
} from 'lucide-react';
import { ErrorBoundary } from '../../../components/ui/error-boundary';
import { useCopilotOrchestrator } from '../hooks/useCopilotOrchestrator';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';

const SUGGESTIONS = [
  'Show students at risk',
  'Attendance trend this month',
  'Compare this month with last month',
  'Which modules have the lowest grades?',
];

function CopilotPanelContent() {
  const [query, setQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { history, scope, ask, clearHistory, isLoading, error } = useCopilotOrchestrator();
  const canAsk = useMemo(() => query.trim().length >= 3 && !isLoading, [query, isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history, isLoading]);

  const handleAsk = (value?: string) => {
    const next = (value ?? query).trim();
    if (next.length < 3 || isLoading) return;
    setQuery('');
    ask(next);
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(e.target.value);
    // Auto-resize
    e.target.style.height = 'inherit';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex h-full w-full bg-theme-surface dark:bg-slate-950 overflow-hidden">
      {/* Sidebar */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="flex-shrink-0 border-r border-theme-border dark:border-theme-border bg-theme-surface dark:bg-theme-surface hidden md:flex flex-col"
          >
            <div className="p-4">
              <button 
                onClick={clearHistory}
                className="flex w-full items-center gap-2 rounded-xl border border-theme-border dark:border-theme-border bg-theme-surface dark:bg-theme-surface px-4 py-2 text-sm font-medium text-theme-text-primary shadow-sm transition-colors hover:bg-theme-hover-card-bg"
              >
                <Plus className="h-4 w-4" />
                New Chat
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-3 py-2 custom-scrollbar">
              <div className="text-xs font-semibold uppercase tracking-wider text-theme-text-secondary dark:text-theme-text-secondary mb-3 px-2">
                Recent Conversations
              </div>
              {history.length === 0 ? (
                <div className="px-2 text-sm text-theme-text-secondary dark:text-theme-text-secondary">No recent chats.</div>
              ) : (
                <div className="space-y-1">
                  {history.slice().reverse().map((item) => (
                    <button
                      key={item.id}
                      className="w-full text-left truncate rounded-lg px-3 py-2 text-sm text-theme-text-primary dark:text-theme-text-secondary hover:bg-theme-hover-card-bg transition-colors"
                    >
                      {item.query}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-theme-border dark:border-theme-border">
              <div className="flex items-center gap-3 rounded-xl bg-theme-surface dark:bg-theme-surface p-3 shadow-sm border border-theme-border dark:border-theme-border">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-theme-text-primary dark:text-theme-text-primary">AI Assistant</span>
                  <span className="text-xs text-theme-text-secondary dark:text-theme-text-secondary">Scope: {scope}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col h-full bg-theme-surface dark:bg-slate-950 relative">
        {/* Header */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-theme-border dark:border-theme-border bg-theme-surface dark:bg-slate-950/80 px-4 backdrop-blur-md sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-theme-text-secondary hover:bg-theme-hover-card-bg"
          >
            <PanelLeft className="h-5 w-5" />
          </button>
          <div className="font-semibold text-theme-text-primary dark:text-theme-text-primary">
            Analytics Copilot
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={clearHistory}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-950/50 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth custom-scrollbar">
          <div className="mx-auto max-w-4xl space-y-8">
            {history.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center pt-20 pb-10 text-center"
              >
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                  <Sparkles className="h-8 w-8" />
                </div>
                <h2 className="mb-2 text-2xl font-bold text-theme-text-primary dark:text-theme-text-primary">
                  How can I help you today?
                </h2>
                <p className="mb-8 max-w-md text-theme-text-secondary dark:text-theme-text-secondary">
                  I can analyze student performance, attendance trends, and help you identify risks within your permitted scope.
                </p>
                <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleAsk(suggestion)}
                      className="flex items-center justify-between rounded-xl border border-theme-border dark:border-theme-border bg-theme-surface dark:bg-theme-surface p-4 text-left transition-all hover:bg-theme-hover-card-bg hover:shadow-sm"
                    >
                      <span className="text-sm font-medium text-theme-text-primary dark:text-theme-text-secondary">{suggestion}</span>
                      <ChevronDown className="h-4 w-4 -rotate-90 text-theme-text-secondary opacity-0 transition-opacity group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              history.map((item, idx) => (
                <div key={item.id} className="space-y-6">
                  {/* User Message */}
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex justify-end"
                  >
                    <div className="max-w-[85%] rounded-3xl rounded-tr-sm bg-theme-hover-card-bg text-theme-hover-card-fg px-5 py-3.5 shadow-sm">
                      <p className="text-sm leading-relaxed">{item.query}</p>
                    </div>
                  </motion.div>

                  {/* AI Message */}
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-4"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/20 dark:bg-blue-900 text-blue-600 dark:text-blue-300 mt-1">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-4">
                      {/* Summary Block */}
                      <div className="prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed">
                        <p>{item.response.summary}</p>
                      </div>

                      {/* Structured Data Cards */}
                      {(item.response.insights.length > 0 || item.response.recommendations.length > 0) && (
                        <div className="grid gap-4 sm:grid-cols-2 mt-4">
                          {item.response.insights.length > 0 && (
                            <div className="rounded-2xl border border-theme-border dark:border-theme-border bg-theme-surface dark:bg-theme-surface p-4">
                              <h4 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-theme-text-primary dark:text-theme-text-secondary">
                                <Sparkles className="h-4 w-4 text-amber-500" />
                                Key Insights
                              </h4>
                              <ul className="space-y-3">
                                {item.response.insights.map((insight) => (
                                  <li key={insight.id} className="text-sm text-theme-text-secondary dark:text-theme-text-secondary">
                                    <strong className="text-theme-text-primary dark:text-theme-text-primary block mb-0.5">{insight.title}</strong>
                                    {insight.detail}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {item.response.recommendations.length > 0 && (
                            <div className="rounded-2xl border border-emerald-500/20 dark:border-emerald-900/30 bg-emerald-500/10/50 dark:bg-emerald-900/10 p-4">
                              <h4 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                                <Lightbulb className="h-4 w-4" />
                                Recommendations
                              </h4>
                              <ul className="space-y-2">
                                {item.response.recommendations.map((rec) => (
                                  <li key={rec.id} className="flex items-start gap-2 text-sm text-emerald-400 dark:text-emerald-300">
                                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                                    {rec.label}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-2">
                        <button 
                          onClick={() => copyToClipboard(item.response.summary, item.id)}
                          className="flex items-center gap-1.5 rounded-lg border border-theme-border dark:border-theme-border bg-theme-surface dark:bg-theme-surface px-3 py-1.5 text-xs font-medium text-theme-text-secondary transition-colors hover:bg-theme-hover-card-bg"
                        >
                          {copiedId === item.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                          {copiedId === item.id ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              ))
            )}

            {/* Loading State */}
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/20 dark:bg-blue-900 text-blue-600 dark:text-blue-300 mt-1">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
                <div className="flex-1 space-y-3 pt-2">
                  <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-theme-surface animate-pulse" />
                  <div className="h-4 w-1/2 rounded bg-slate-200 dark:bg-theme-surface animate-pulse" />
                </div>
              </motion.div>
            )}

            {/* Error State */}
            {error && (
              <div className="mx-auto max-w-2xl rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-400 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <strong>An error occurred:</strong> {error.message}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-theme-surface dark:bg-slate-950">
          <div className="mx-auto max-w-4xl relative">
            <div className="relative flex flex-col w-full rounded-3xl border border-theme-border dark:border-theme-border bg-theme-surface dark:bg-theme-surface shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 dark:focus-within:border-blue-500 overflow-hidden">
              <textarea
                ref={textareaRef}
                value={query}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="Message Copilot..."
                className="max-h-[200px] min-h-[60px] w-full resize-none border-0 bg-transparent px-5 py-4 text-sm text-theme-text-primary dark:text-theme-text-primary placeholder-slate-400 focus:outline-none custom-scrollbar"
                rows={1}
              />
              <div className="flex items-center justify-between px-4 pb-3">
                <div className="flex items-center gap-1">
                  <button className="flex h-8 w-8 items-center justify-center rounded-full text-theme-text-secondary hover:bg-theme-hover-card-bg transition-colors">
                    <Paperclip className="h-4 w-4" />
                  </button>
                </div>
                <button
                  onClick={() => handleAsk()}
                  disabled={!canAsk}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-theme-hover-card-bg text-theme-hover-card-fg disabled:opacity-50 disabled:cursor-not-allowed transition-transform hover:scale-105 active:scale-95"
                >
                  <Send className="h-4 w-4 -ml-0.5" />
                </button>
              </div>
            </div>
            <div className="mt-2 text-center text-xs text-theme-text-secondary dark:text-theme-text-secondary">
              Copilot uses role-based access control to ensure secure insights.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CopilotPanel() {
  return (
    <ErrorBoundary>
      <CopilotPanelContent />
    </ErrorBoundary>
  );
}

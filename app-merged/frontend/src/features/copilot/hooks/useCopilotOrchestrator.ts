import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../hooks/useAuth';
import { INITIAL_COPILOT_MEMORY, updateCopilotMemory } from '../context/copilotMemory';
import type { CopilotMemoryState, CopilotResponse } from '../contracts';
import { orchestrateCopilotResponse } from '../orchestrator/orchestrateCopilotResponse';

type CopilotScope = 'admin' | 'teacher' | 'parent';

interface CopilotHistoryItem {
  id: string;
  query: string;
  response: CopilotResponse;
}

function resolveScope(role?: string): CopilotScope {
  if (role === 'teacher' || role === 'formateur') return 'teacher';
  if (role === 'parent') return 'parent';
  return 'admin';
}

export function useCopilotOrchestrator() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [memory, setMemory] = useState<CopilotMemoryState>(INITIAL_COPILOT_MEMORY);
  const [history, setHistory] = useState<CopilotHistoryItem[]>([]);
  const scope = useMemo(() => resolveScope(user?.role), [user?.role]);

  const askMutation = useMutation({
    mutationFn: async (query: string) =>
      orchestrateCopilotResponse(queryClient, { query, scope, userRole: user?.role ?? 'admin', memory }),
    onSuccess: ({ intent, response }, query) => {
      setMemory((previous) => updateCopilotMemory(previous, intent));
      setHistory((previous) => [...previous, { id: crypto.randomUUID(), query, response }]);
    },
  });

  return {
    scope,
    memory,
    history,
    latest: history.at(-1),
    ask: askMutation.mutate,
    clearHistory: () => setHistory([]),
    isLoading: askMutation.isPending,
    error: askMutation.error as Error | null,
  };
}

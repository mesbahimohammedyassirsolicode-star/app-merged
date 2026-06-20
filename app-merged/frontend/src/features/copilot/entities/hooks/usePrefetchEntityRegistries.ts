import { useQueryClient } from '@tanstack/react-query';
import type { CopilotEntityLoadContext } from '../contracts';
import { loadEntityRegistries } from '../cache/loadEntityRegistries';

/**
 * Optional warm-up for autocomplete / future websocket-driven invalidation.
 * Call from Copilot panel on mount or focus.
 */
export function usePrefetchEntityRegistries() {
  const queryClient = useQueryClient();

  return (ctx: CopilotEntityLoadContext) => loadEntityRegistries(queryClient, ctx);
}

import { normalizeLabel } from './normalize';

/**
 * Deterministic alias tokens: expands query token to equivalent normalized tokens.
 * Extend this map in config — never infer aliases via LLM.
 */
const TOKEN_ALIASES: Record<string, string[]> = {
  maths: ['math', 'mathematiques', 'mathematics'],
  info: ['informatique', 'computer science'],
};

export function expandAliasTokens(token: string): string[] {
  const n = normalizeLabel(token);
  if (!n) return [];
  const out = new Set<string>([n]);
  const aliases = TOKEN_ALIASES[n];
  if (aliases) {
    for (const a of aliases) {
      out.add(normalizeLabel(a));
    }
  }
  return [...out];
}

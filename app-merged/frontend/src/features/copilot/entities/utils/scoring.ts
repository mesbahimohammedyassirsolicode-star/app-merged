import type { EntityResolutionMethod } from '../contracts';
import { expandAliasTokens } from './aliasExpand';
import { normalizeCode, normalizeLabel } from './normalize';

export type MatchTier = {
  score: number;
  method: EntityResolutionMethod;
};

export function scoreModuleMatch(token: string, code: string, label: string): MatchTier | null {
  const tCode = normalizeCode(token);
  const mCode = normalizeCode(code);
  const nt = normalizeLabel(token);
  const nl = normalizeLabel(label);
  const nc = normalizeLabel(code);

  if (!token.trim()) return null;

  if (/^\d+$/.test(token.trim())) {
    return null;
  }

  if (mCode === tCode && tCode.length > 0) {
    return { score: 100, method: 'exact' };
  }

  if (nl === nt && nt.length > 0) {
    return { score: 95, method: 'normalized' };
  }

  if (nc === nt && nt.length > 0) {
    return { score: 92, method: 'normalized' };
  }

  for (const alias of expandAliasTokens(token)) {
    if (alias && nl === alias) {
      return { score: 88, method: 'alias' };
    }
    if (alias.length >= 3 && nl.startsWith(alias)) {
      return { score: 72, method: 'alias' };
    }
    if (alias.length >= 3 && nl.includes(alias)) {
      return { score: 55, method: 'alias' };
    }
  }

  return null;
}

export function scoreGroupMatch(token: string, label: string): MatchTier | null {
  const nt = normalizeLabel(token);
  const nl = normalizeLabel(label);
  if (!nt) return null;

  if (/^\d+$/.test(token.trim())) {
    return null;
  }

  if (nl === nt) return { score: 100, method: 'exact' };
  if (nl.startsWith(nt)) return { score: 80, method: 'normalized' };
  if (nt.length >= 3 && nl.includes(nt)) return { score: 60, method: 'alias' };
  return null;
}

export function scoreNameMatch(token: string, name: string): MatchTier | null {
  const nt = normalizeLabel(token);
  const nn = normalizeLabel(name);
  if (!nt) return null;

  if (nn === nt) return { score: 100, method: 'exact' };
  if (nn.startsWith(nt)) return { score: 85, method: 'normalized' };
  if (nt.length >= 3 && nn.includes(nt)) return { score: 55, method: 'alias' };
  return null;
}

export function confidenceFromScore(score: number): number {
  return Math.min(100, Math.round(score)) / 100;
}

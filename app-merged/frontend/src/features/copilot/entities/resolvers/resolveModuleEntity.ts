import type { EntityResolutionTraceEntry, EntitySlotResult, ModuleRegistryRow } from '../contracts';
import { confidenceFromScore, scoreModuleMatch } from '../utils/scoring';
import { normalizeCode } from '../utils/normalize';

function traceFrom(
  input: string,
  row: ModuleRegistryRow,
  method: EntityResolutionTraceEntry['resolutionMethod'],
  confidence: number
): EntityResolutionTraceEntry {
  return {
    input,
    entityType: 'module',
    resolvedTo: `module_id=${row.id}`,
    resolutionMethod: method,
    confidence,
  };
}

export function resolveModuleEntity(input: string, corpus: ModuleRegistryRow[]): EntitySlotResult {
  const raw = input.trim();
  if (!raw) {
    return { status: 'skipped', reason: 'not_applicable' };
  }

  if (corpus.length === 0) {
    return {
      status: 'unresolved',
      data: { kind: 'unresolved', entityType: 'module', input: raw, reason: 'empty_corpus' },
    };
  }

  if (/^\d+$/.test(raw)) {
    const id = Number(raw);
    const row = corpus.find((m) => m.id === id);
    if (!row) {
      return {
        status: 'unresolved',
        data: { kind: 'unresolved', entityType: 'module', input: raw, reason: 'no_match' },
      };
    }
    const conf = confidenceFromScore(100);
    return {
      status: 'resolved',
      entity: {
        type: 'module',
        id: row.id,
        label: `${row.code} — ${row.label}`,
        confidence: conf,
        source: 'exact',
        context: row.filiereLabel ? { filiere: row.filiereLabel } : undefined,
      },
      trace: traceFrom(raw, row, 'exact', conf),
    };
  }

  const ranked: Array<{ row: ModuleRegistryRow; score: number; method: EntityResolutionTraceEntry['resolutionMethod'] }> =
    [];

  for (const row of corpus) {
    const tier = scoreModuleMatch(raw, row.code, row.label);
    if (tier) {
      ranked.push({ row, score: tier.score, method: tier.method });
    }
  }

  if (ranked.length === 0) {
    return {
      status: 'unresolved',
      data: { kind: 'unresolved', entityType: 'module', input: raw, reason: 'no_match' },
    };
  }

  ranked.sort((a, b) => b.score - a.score);
  const best = ranked[0].score;
  const top = ranked.filter((r) => r.score === best);

  if (top.length > 1) {
    return {
      status: 'ambiguous',
      data: {
        kind: 'ambiguous',
        entityType: 'module',
        input: raw,
        candidates: top.map((t) => ({
          type: 'module' as const,
          id: t.row.id,
          label: `${t.row.code} — ${t.row.label}`,
          confidence: confidenceFromScore(t.score),
          source: t.method,
          disambiguator: t.row.filiereLabel ? `Filière: ${t.row.filiereLabel}` : undefined,
          context: t.row.filiereLabel ? { filiere: t.row.filiereLabel } : undefined,
        })),
      },
    };
  }

  const pick = top[0];
  const conf = confidenceFromScore(pick.score);
  return {
    status: 'resolved',
    entity: {
      type: 'module',
      id: pick.row.id,
      label: `${pick.row.code} — ${pick.row.label}`,
      confidence: conf,
      source: pick.method,
      context: pick.row.filiereLabel ? { filiere: pick.row.filiereLabel } : undefined,
    },
    trace: traceFrom(raw, pick.row, pick.method, conf),
  };
}

/** Fast path when intent already extracted a canonical module code (e.g. DEV101). */
export function resolveModuleEntityByCode(code: string, corpus: ModuleRegistryRow[]): EntitySlotResult {
  const c = normalizeCode(code);
  const exact = corpus.filter((m) => normalizeCode(m.code) === c);
  if (exact.length === 1) {
    const row = exact[0];
    const conf = confidenceFromScore(100);
    return {
      status: 'resolved',
      entity: {
        type: 'module',
        id: row.id,
        label: `${row.code} — ${row.label}`,
        confidence: conf,
        source: 'exact',
        context: row.filiereLabel ? { filiere: row.filiereLabel } : undefined,
      },
      trace: traceFrom(code, row, 'exact', conf),
    };
  }
  if (exact.length > 1) {
    return {
      status: 'ambiguous',
      data: {
        kind: 'ambiguous',
        entityType: 'module',
        input: code,
        candidates: exact.map((row) => ({
          type: 'module' as const,
          id: row.id,
          label: `${row.code} — ${row.label}`,
          confidence: 1,
          source: 'exact' as const,
          disambiguator: row.filiereLabel ? `Filière: ${row.filiereLabel}` : undefined,
        })),
      },
    };
  }
  return resolveModuleEntity(code, corpus);
}

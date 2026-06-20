import type { EntityResolutionTraceEntry, EntitySlotResult, GroupRegistryRow } from '../contracts';
import { confidenceFromScore, scoreGroupMatch } from '../utils/scoring';

function traceFrom(
  input: string,
  row: GroupRegistryRow,
  method: EntityResolutionTraceEntry['resolutionMethod'],
  confidence: number
): EntityResolutionTraceEntry {
  return {
    input,
    entityType: 'group',
    resolvedTo: `group_id=${row.id}`,
    resolutionMethod: method,
    confidence,
  };
}

export function resolveGroupEntity(input: string, corpus: GroupRegistryRow[]): EntitySlotResult {
  const raw = input.trim();
  if (!raw) {
    return { status: 'skipped', reason: 'not_applicable' };
  }

  if (corpus.length === 0) {
    return {
      status: 'unresolved',
      data: { kind: 'unresolved', entityType: 'group', input: raw, reason: 'empty_corpus' },
    };
  }

  if (/^\d+$/.test(raw)) {
    const id = Number(raw);
    const row = corpus.find((g) => g.id === id);
    if (!row) {
      return {
        status: 'unresolved',
        data: { kind: 'unresolved', entityType: 'group', input: raw, reason: 'no_match' },
      };
    }
    const conf = confidenceFromScore(100);
    return {
      status: 'resolved',
      entity: {
        type: 'group',
        id: row.id,
        label: row.label,
        confidence: conf,
        source: 'exact',
        context: row.filiereLabel ? { filiere: row.filiereLabel } : undefined,
      },
      trace: traceFrom(raw, row, 'exact', conf),
    };
  }

  const ranked: Array<{ row: GroupRegistryRow; score: number; method: EntityResolutionTraceEntry['resolutionMethod'] }> =
    [];

  for (const row of corpus) {
    const tier = scoreGroupMatch(raw, row.label);
    if (tier) {
      ranked.push({ row, score: tier.score, method: tier.method });
    }
  }

  if (ranked.length === 0) {
    return {
      status: 'unresolved',
      data: { kind: 'unresolved', entityType: 'group', input: raw, reason: 'no_match' },
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
        entityType: 'group',
        input: raw,
        candidates: top.map((t) => ({
          type: 'group' as const,
          id: t.row.id,
          label: t.row.label,
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
      type: 'group',
      id: pick.row.id,
      label: pick.row.label,
      confidence: conf,
      source: pick.method,
      context: pick.row.filiereLabel ? { filiere: pick.row.filiereLabel } : undefined,
    },
    trace: traceFrom(raw, pick.row, pick.method, conf),
  };
}

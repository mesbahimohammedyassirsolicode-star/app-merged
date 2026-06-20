import type { EntityResolutionTraceEntry, EntitySlotResult, TeacherRegistryRow } from '../contracts';
import { confidenceFromScore, scoreNameMatch } from '../utils/scoring';

function traceFrom(
  input: string,
  row: TeacherRegistryRow,
  method: EntityResolutionTraceEntry['resolutionMethod'],
  confidence: number
): EntityResolutionTraceEntry {
  return {
    input,
    entityType: 'teacher',
    resolvedTo: `user_id=${row.userId}`,
    resolutionMethod: method,
    confidence,
  };
}

export function resolveTeacherEntity(input: string, corpus: TeacherRegistryRow[]): EntitySlotResult {
  const raw = input.trim();
  if (!raw) {
    return { status: 'skipped', reason: 'not_applicable' };
  }

  if (corpus.length === 0) {
    return {
      status: 'unresolved',
      data: { kind: 'unresolved', entityType: 'teacher', input: raw, reason: 'empty_corpus' },
    };
  }

  if (/^\d+$/.test(raw)) {
    const id = Number(raw);
    const row = corpus.find((t) => t.userId === id);
    if (!row) {
      return {
        status: 'unresolved',
        data: { kind: 'unresolved', entityType: 'teacher', input: raw, reason: 'no_match' },
      };
    }
    const conf = confidenceFromScore(100);
    return {
      status: 'resolved',
      entity: {
        type: 'teacher',
        id: row.userId,
        label: row.name,
        confidence: conf,
        source: 'exact',
        context: { role: row.role },
      },
      trace: traceFrom(raw, row, 'exact', conf),
    };
  }

  const ranked: Array<{ row: TeacherRegistryRow; score: number; method: EntityResolutionTraceEntry['resolutionMethod'] }> =
    [];

  for (const row of corpus) {
    const tier = scoreNameMatch(raw, row.name);
    if (tier) {
      ranked.push({ row, score: tier.score, method: tier.method });
    }
  }

  if (ranked.length === 0) {
    return {
      status: 'unresolved',
      data: { kind: 'unresolved', entityType: 'teacher', input: raw, reason: 'no_match' },
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
        entityType: 'teacher',
        input: raw,
        candidates: top.map((t) => ({
          type: 'teacher' as const,
          id: t.row.userId,
          label: t.row.name,
          confidence: confidenceFromScore(t.score),
          source: t.method,
          disambiguator: t.row.role,
          context: { role: t.row.role },
        })),
      },
    };
  }

  const pick = top[0];
  const conf = confidenceFromScore(pick.score);
  return {
    status: 'resolved',
    entity: {
      type: 'teacher',
      id: pick.row.userId,
      label: pick.row.name,
      confidence: conf,
      source: pick.method,
      context: { role: pick.row.role },
    },
    trace: traceFrom(raw, pick.row, pick.method, conf),
  };
}

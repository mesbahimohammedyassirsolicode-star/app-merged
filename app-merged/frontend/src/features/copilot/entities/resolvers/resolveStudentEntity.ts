import type { EntityResolutionTraceEntry, EntitySlotResult, StudentRegistryRow } from '../contracts';
import { confidenceFromScore, scoreNameMatch } from '../utils/scoring';

function traceFrom(
  input: string,
  row: StudentRegistryRow,
  method: EntityResolutionTraceEntry['resolutionMethod'],
  confidence: number
): EntityResolutionTraceEntry {
  return {
    input,
    entityType: 'student',
    resolvedTo: `stagiaire_id=${row.stagiaireId}`,
    resolutionMethod: method,
    confidence,
  };
}

export function resolveStudentEntity(input: string, corpus: StudentRegistryRow[]): EntitySlotResult {
  const raw = input.trim();
  if (!raw) {
    return { status: 'skipped', reason: 'not_applicable' };
  }

  if (corpus.length === 0) {
    return {
      status: 'unresolved',
      data: { kind: 'unresolved', entityType: 'student', input: raw, reason: 'empty_corpus' },
    };
  }

  if (/^\d+$/.test(raw)) {
    const id = Number(raw);
    const byStag = corpus.find((s) => s.stagiaireId === id);
    if (byStag) {
      const conf = confidenceFromScore(100);
      return {
        status: 'resolved',
        entity: {
          type: 'student',
          id: byStag.stagiaireId,
          label: byStag.name,
          confidence: conf,
          source: 'exact',
        },
        trace: traceFrom(raw, byStag, 'exact', conf),
      };
    }
    const byUser = corpus.find((s) => s.userId === id);
    if (byUser) {
      const conf = confidenceFromScore(100);
      return {
        status: 'resolved',
        entity: {
          type: 'student',
          id: byUser.stagiaireId,
          label: byUser.name,
          confidence: conf,
          source: 'exact',
        },
        trace: traceFrom(raw, byUser, 'exact', conf),
      };
    }
    return {
      status: 'unresolved',
      data: { kind: 'unresolved', entityType: 'student', input: raw, reason: 'no_match' },
    };
  }

  const ranked: Array<{ row: StudentRegistryRow; score: number; method: EntityResolutionTraceEntry['resolutionMethod'] }> =
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
      data: { kind: 'unresolved', entityType: 'student', input: raw, reason: 'no_match' },
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
        entityType: 'student',
        input: raw,
        candidates: top.map((t) => ({
          type: 'student' as const,
          id: t.row.stagiaireId,
          label: t.row.name,
          confidence: confidenceFromScore(t.score),
          source: t.method,
        })),
      },
    };
  }

  const pick = top[0];
  const conf = confidenceFromScore(pick.score);
  return {
    status: 'resolved',
    entity: {
      type: 'student',
      id: pick.row.stagiaireId,
      label: pick.row.name,
      confidence: conf,
      source: pick.method,
    },
    trace: traceFrom(raw, pick.row, pick.method, conf),
  };
}

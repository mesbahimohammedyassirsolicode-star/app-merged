import type { EntityResolutionTraceEntry } from '../contracts';

/** Serializable shape for logs / future audit pipelines (no PII beyond entity labels already chosen). */
export function toAuditTracePayload(traces: EntityResolutionTraceEntry[]) {
  return traces.map((t) => ({
    input: t.input,
    resolved_to: t.resolvedTo,
    resolution_method: t.resolutionMethod,
    confidence: t.confidence,
  }));
}

/**
 * Entity resolution contracts — deterministic, explainable, no probabilistic "AI guessing".
 * Explainability metadata (trace entries, ambiguity payloads) is required for auditability:
 * every resolved id must be reconstructible from corpus + rules.
 */

export type ResolvedEntityType = 'module' | 'group' | 'student' | 'teacher';

/** Backend analytics filters use stagiaire record id as student scope in risk datasets. */
export type StudentEntityId = {
  stagiaireId: number;
  userId?: number;
};

export type EntityResolutionMethod = 'exact' | 'normalized' | 'alias';

export interface ResolvedEntity {
  type: ResolvedEntityType;
  id: number;
  label: string;
  confidence: number;
  source: EntityResolutionMethod;
  /** Extra deterministic context (e.g. filière) for audit logs and UI disambiguation. */
  context?: Record<string, string | number>;
}

export interface AmbiguousEntityCandidate extends ResolvedEntity {
  disambiguator?: string;
}

export interface AmbiguousEntityResolution {
  kind: 'ambiguous';
  entityType: ResolvedEntityType;
  input: string;
  candidates: AmbiguousEntityCandidate[];
}

export interface UnresolvedEntity {
  kind: 'unresolved';
  entityType: ResolvedEntityType;
  input: string;
  reason: 'no_match' | 'empty_corpus' | 'invalid_token';
}

export interface EntityResolutionTraceEntry {
  input: string;
  entityType: ResolvedEntityType;
  resolvedTo: string;
  resolutionMethod: EntityResolutionMethod;
  confidence: number;
}

export type EntitySlotResult =
  | { status: 'resolved'; entity: ResolvedEntity; trace: EntityResolutionTraceEntry }
  | { status: 'ambiguous'; data: AmbiguousEntityResolution }
  | { status: 'unresolved'; data: UnresolvedEntity }
  | { status: 'skipped'; reason: 'not_applicable' };

export interface EntityResolutionResult {
  slots: Record<string, EntitySlotResult>;
  traces: EntityResolutionTraceEntry[];
}

export interface CopilotClarification {
  reason: 'ambiguous_entity' | 'unresolved_entity' | 'missing_required_slot';
  message: string;
  /** Deterministic follow-ups the user can click (labels only; re-query uses same parser). */
  suggestedQueries?: string[];
  candidates?: Array<{
    type: ResolvedEntityType;
    id: number;
    label: string;
    disambiguator?: string;
  }>;
}

export interface ModuleRegistryRow {
  id: number;
  code: string;
  label: string;
  filiereId?: number;
  filiereLabel?: string;
}

export interface GroupRegistryRow {
  id: number;
  label: string;
  filiereId?: number;
  filiereLabel?: string;
}

export interface StudentRegistryRow {
  stagiaireId: number;
  userId: number;
  name: string;
}

export interface TeacherRegistryRow {
  userId: number;
  name: string;
  role: string;
}

export interface EntityRegistries {
  modules: ModuleRegistryRow[];
  groups: GroupRegistryRow[];
  students: StudentRegistryRow[];
  teachers: TeacherRegistryRow[];
}

export interface CopilotEntityLoadContext {
  copilotScope: 'admin' | 'teacher' | 'parent';
  userRole: string;
}

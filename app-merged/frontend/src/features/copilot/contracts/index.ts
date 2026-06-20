import type { AnalyticsFiltersContract, AnalyticsOverviewContract, AtRiskStudentContract } from '../../analytics/contracts';
import type { AnalyticsStructuredQueryRow } from '../../../api/api/analytics';
import type { CopilotClarification, EntityResolutionTraceEntry } from '../entities/contracts';

export type CopilotIntentName =
  | 'students_at_risk'
  | 'attendance_trend'
  | 'compare_periods'
  | 'compare_groups'
  | 'attendance_by_module'
  | 'top_students'
  | 'weakest_modules'
  | 'overview';

export type CopilotIntentSource = 'rule';
export type CopilotTimeRangePreset = 'this_month' | 'last_month' | 'this_year' | 'custom' | 'none';
export type CopilotRecommendationPriority = 'high' | 'medium' | 'low';

/** Mentions extracted deterministically from the user query (before entity resolution). */
export interface CopilotEntityMentions {
  moduleCode?: string;
  moduleRaw?: string;
  groupA?: string;
  groupB?: string;
  studentRaw?: string;
  teacherRaw?: string;
}

export interface CopilotIntent {
  name: CopilotIntentName;
  source: CopilotIntentSource;
  confidence: 1;
  rawQuery: string;
  filters: AnalyticsFiltersContract;
  /** Legacy hint; resolution merges into filters.module_id when possible. */
  moduleCode?: string;
  timeRange: {
    preset: CopilotTimeRangePreset;
    dateFrom?: string;
    dateTo?: string;
    comparison?: {
      dateFrom?: string;
      dateTo?: string;
      preset: CopilotTimeRangePreset;
    };
  };
  entityMentions: CopilotEntityMentions;
}

export interface CopilotInsightRecord {
  id: string;
  title: string;
  detail: string;
  severity: 'critical' | 'warning' | 'positive' | 'neutral';
  metric?: string;
}

export interface CopilotRecommendationRecord {
  id: string;
  label: string;
  priority: CopilotRecommendationPriority;
  reason: string;
}

export interface CopilotChartSuggestion {
  id: string;
  chartType: 'line' | 'bar';
  title: string;
  labels: string[];
  values: number[];
}

export interface CopilotResponseMetadata {
  traceId: string;
  generatedAt: string;
  intent: CopilotIntentName;
  intentSource: CopilotIntentSource;
  scope: 'admin' | 'teacher' | 'parent';
  cache: {
    reusedOverview: boolean;
    queryKey: readonly unknown[];
  };
  guardrails: string[];
  unresolvedFilters?: string[];
  /** Deterministic audit trail: inputs → ids + method (trust + compliance). */
  resolved_entities?: EntityResolutionTraceEntry[];
  clarification?: CopilotClarification;
  executionBlocked?: boolean;
}

export interface CopilotResponse {
  title: string;
  summary: string;
  insights: CopilotInsightRecord[];
  recommendations: CopilotRecommendationRecord[];
  charts?: CopilotChartSuggestion[];
  metadata: CopilotResponseMetadata;
}

export interface CopilotMemoryState {
  lastIntent?: CopilotIntentName;
  lastFilters: AnalyticsFiltersContract;
  lastModuleCode?: string;
  lastTimeRangePreset: CopilotTimeRangePreset;
}

export interface CopilotOrchestratorInput {
  query: string;
  scope: 'admin' | 'teacher' | 'parent';
  userRole: string;
  memory: CopilotMemoryState;
}

export interface CopilotOrchestratorDataSources {
  overview: AnalyticsOverviewContract;
  studentsAtRisk: AtRiskStudentContract[];
}

/** Optional payloads produced by analytics domains (overview + structured query). */
export interface CopilotFulfillmentContext {
  overview?: AnalyticsOverviewContract;
  overviewB?: AnalyticsOverviewContract;
  structuredRows?: AnalyticsStructuredQueryRow[];
  structuredMetric?: 'average_grade' | 'attendance_rate';
  studentFilterStagiaireId?: number;
  /** Resolved labels for compare_groups (deterministic UI copy). */
  compareGroupLabels?: [string, string];
}

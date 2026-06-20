import type { QueryClient } from '@tanstack/react-query';
import { analyticsApi } from '../../../api/api/analytics';
import { queryKeys } from '../../../lib/query-keys';
import type { AnalyticsFiltersContract, AnalyticsOverviewContract } from '../../analytics/contracts';
import type { CopilotFulfillmentContext, CopilotIntent, CopilotOrchestratorInput, CopilotResponse } from '../contracts';
import { resolveCopilotIntent } from '../intents/resolveCopilotIntent';
import { resolveCopilotTitle, buildDeterministicSummary } from '../prompts/summaryTemplates';
import { composeInsightRecords } from '../transforms/composeInsightRecords';
import { composeRecommendationRecords } from '../transforms/composeRecommendationRecords';
import { loadEntityRegistries } from '../entities/cache/loadEntityRegistries';
import type { CopilotClarification, EntityResolutionResult, EntitySlotResult } from '../entities/contracts';
import {
  getEntityResolutionBlocker,
  resolveEntitiesForCopilotIntent,
} from '../entities/resolvers/resolveEntitiesForCopilotIntent';

async function getOverviewFromCacheOrFetch(
  queryClient: QueryClient,
  scope: CopilotOrchestratorInput['scope'],
  filters: AnalyticsFiltersContract
): Promise<{ overview: AnalyticsOverviewContract; reused: boolean; queryKey: readonly unknown[] }> {
  const queryKey = queryKeys.analytics.overview(scope, filters);
  const cached = queryClient.getQueryData<AnalyticsOverviewContract>(queryKey);
  if (cached) {
    return { overview: cached, reused: true, queryKey };
  }

  const overview = await queryClient.fetchQuery({
    queryKey,
    queryFn: () => analyticsApi.overview(filters),
    staleTime: 5 * 60 * 1000,
  });

  return { overview, reused: false, queryKey };
}

async function getStructuredFromCacheOrFetch(
  queryClient: QueryClient,
  metric: 'average_grade' | 'attendance_rate',
  dimension: 'module' | 'student',
  filters: Pick<AnalyticsFiltersContract, 'date_from' | 'date_to' | 'module_id' | 'group_id'>
) {
  const queryKey = queryKeys.analytics.structuredQuery(metric, dimension, {
    date_from: filters.date_from ?? null,
    date_to: filters.date_to ?? null,
    module_id: filters.module_id ?? null,
    group_id: filters.group_id ?? null,
  });

  return queryClient.fetchQuery({
    queryKey,
    queryFn: () => analyticsApi.structuredQuery({ metric, dimension, filters }),
    staleTime: 5 * 60 * 1000,
  });
}

function mergeResolvedIntoFilters(
  base: AnalyticsFiltersContract,
  intent: CopilotIntent,
  resolution: EntityResolutionResult
): AnalyticsFiltersContract {
  const out = { ...base };
  const mod = resolution.slots.module;
  if (mod.status === 'resolved' && mod.entity.type === 'module' && !out.module_id) {
    out.module_id = mod.entity.id;
  }
  if (intent.name !== 'compare_groups') {
    const grp = resolution.slots.groupA;
    if (grp.status === 'resolved' && grp.entity.type === 'group' && !out.group_id) {
      out.group_id = grp.entity.id;
    }
  }
  return out;
}

function clarificationFromBlocker(intent: CopilotIntent, slot: EntitySlotResult): CopilotClarification | null {
  if (slot.status === 'ambiguous') {
    return {
      reason: 'ambiguous_entity',
      message: `Multiple deterministic matches for "${slot.data.input}". Choose a candidate or add a filière / numeric id.`,
      candidates: slot.data.candidates.map((c) => ({
        type: c.type,
        id: c.id,
        label: c.label,
        disambiguator: c.disambiguator,
      })),
      suggestedQueries: slot.data.candidates.slice(0, 3).map((c) => {
        if (c.type === 'module') {
          return `top students in ${c.label}`;
        }
        if (c.type === 'group') {
          return `compare group ${c.id} and group …`;
        }
        return `${intent.rawQuery} — use id ${c.id}`;
      }),
    };
  }
  if (slot.status === 'unresolved') {
    return {
      reason: 'unresolved_entity',
      message: `No deterministic match for ${slot.data.entityType} "${slot.data.input}" within your loaded entity corpus.`,
    };
  }
  return null;
}

function buildClarificationResponse(
  intent: CopilotIntent,
  clarification: CopilotClarification,
  traces: EntityResolutionResult['traces'],
  scope: CopilotOrchestratorInput['scope'],
  overviewKey: readonly unknown[]
): CopilotResponse {
  return {
    title: 'Clarification required',
    summary: clarification.message,
    insights: [
      {
        id: 'clarify',
        title: 'Execution blocked',
        detail: clarification.message,
        severity: 'warning',
      },
    ],
    recommendations: (clarification.candidates ?? []).slice(0, 5).map((c, i) => ({
      id: `pick-${i}`,
      label: `Use ${c.type} ${c.id}: ${c.label}${c.disambiguator ? ` (${c.disambiguator})` : ''}`,
      priority: 'medium' as const,
      reason: 'Deterministic disambiguation candidate',
    })),
    metadata: {
      traceId: crypto.randomUUID(),
      generatedAt: new Date().toISOString(),
      intent: intent.name,
      intentSource: intent.source,
      scope,
      cache: { reusedOverview: false, queryKey: overviewKey },
      guardrails: [
        'Ambiguous or unresolved entities never execute analytics silently.',
        'No LLM-based entity guessing.',
      ],
      resolved_entities: traces,
      clarification,
      executionBlocked: true,
    },
  };
}

function composeCharts(intent: CopilotIntent, fulfillment: CopilotFulfillmentContext): CopilotResponse['charts'] {
  const { overview, overviewB, structuredRows, structuredMetric } = fulfillment;

  if (intent.name === 'compare_groups' && overview && overviewB) {
    const [la, lb] = fulfillment.compareGroupLabels ?? ['Group A', 'Group B'];
    return [
      {
        id: 'compare-attendance',
        chartType: 'bar',
        title: 'Attendance rate by group',
        labels: [la, lb],
        values: [overview.kpis.attendance_rate, overviewB.kpis.attendance_rate],
      },
    ];
  }

  if (structuredRows?.length && structuredMetric === 'average_grade' && intent.name === 'weakest_modules') {
    const sorted = [...structuredRows].sort((a, b) => (a.avg_grade ?? 0) - (b.avg_grade ?? 0)).slice(0, 12);
    return [
      {
        id: 'weak-modules-chart',
        chartType: 'bar',
        title: 'Average grade by module (lowest first)',
        labels: sorted.map((r) => r.label),
        values: sorted.map((r) => r.avg_grade ?? 0),
      },
    ];
  }

  if (structuredRows?.length && structuredMetric === 'attendance_rate' && intent.name === 'attendance_by_module') {
    const sorted = [...structuredRows].sort((a, b) => (a.attendance_rate ?? 0) - (b.attendance_rate ?? 0)).slice(0, 12);
    return [
      {
        id: 'att-module-chart',
        chartType: 'bar',
        title: 'Attendance rate by module',
        labels: sorted.map((r) => r.label),
        values: sorted.map((r) => r.attendance_rate ?? 0),
      },
    ];
  }

  if (structuredRows?.length && structuredMetric === 'average_grade' && intent.name === 'top_students') {
    const sorted = [...structuredRows].sort((a, b) => (b.avg_grade ?? 0) - (a.avg_grade ?? 0)).slice(0, 12);
    return [
      {
        id: 'top-students-chart',
        chartType: 'bar',
        title: 'Top average grades (students)',
        labels: sorted.map((r) => r.label),
        values: sorted.map((r) => r.avg_grade ?? 0),
      },
    ];
  }

  if (!overview) {
    return undefined;
  }

  if (intent.name === 'attendance_trend' || intent.name === 'compare_periods') {
    return [
      {
        id: 'attendance-trend',
        chartType: 'line',
        title: 'Attendance Trend',
        labels: overview.charts.attendance_trends.map((row) => row.period),
        values: overview.charts.attendance_trends.map((row) => row.attendance_rate),
      },
    ];
  }

  return [
    {
      id: 'grade-distribution',
      chartType: 'bar',
      title: 'Grade Distribution',
      labels: overview.charts.grade_distribution.map((row) => row.bucket),
      values: overview.charts.grade_distribution.map((row) => row.count),
    },
  ];
}

export async function orchestrateCopilotResponse(
  queryClient: QueryClient,
  input: CopilotOrchestratorInput
): Promise<{ intent: CopilotIntent; response: CopilotResponse }> {
  const intent = resolveCopilotIntent(input.query, input.memory);
  const registries = await loadEntityRegistries(queryClient, {
    copilotScope: input.scope,
    userRole: input.userRole,
  });
  const entityResult = resolveEntitiesForCopilotIntent(intent, registries);
  const blocker = getEntityResolutionBlocker(intent, entityResult);

  const placeholderKey = queryKeys.analytics.overview(input.scope, intent.filters);

  if (blocker && (blocker.status === 'ambiguous' || blocker.status === 'unresolved')) {
    const clarification = clarificationFromBlocker(intent, blocker);
    if (clarification) {
      return {
        intent,
        response: buildClarificationResponse(intent, clarification, entityResult.traces, input.scope, placeholderKey),
      };
    }
  }

  const executionFilters = mergeResolvedIntoFilters(intent.filters, intent, entityResult);
  const enrichedIntent: CopilotIntent = { ...intent, filters: executionFilters };

  const studentSlot = entityResult.slots.student;
  const studentFilterStagiaireId =
    studentSlot.status === 'resolved' && studentSlot.entity.type === 'student'
      ? studentSlot.entity.id
      : undefined;

  const resolvedEntityTraces = entityResult.traces;
  const teacherResolved = entityResult.slots.teacher.status === 'resolved';

  let fulfillment: CopilotFulfillmentContext = {};
  let overviewReused = false;
  let primaryQueryKey: readonly unknown[] = placeholderKey;

  if (enrichedIntent.name === 'compare_groups') {
    const ga = entityResult.slots.groupA;
    const gb = entityResult.slots.groupB;
    if (ga.status !== 'resolved' || gb.status !== 'resolved' || ga.entity.type !== 'group' || gb.entity.type !== 'group') {
      const clarification: CopilotClarification = {
        reason: 'missing_required_slot',
        message: 'Compare groups requires two resolved group entities.',
      };
      return {
        intent: enrichedIntent,
        response: buildClarificationResponse(enrichedIntent, clarification, resolvedEntityTraces, input.scope, placeholderKey),
      };
    }

    const filtersA = { ...executionFilters, group_id: ga.entity.id };
    const filtersB = { ...executionFilters, group_id: gb.entity.id };
    const [a, b] = await Promise.all([
      getOverviewFromCacheOrFetch(queryClient, input.scope, filtersA),
      getOverviewFromCacheOrFetch(queryClient, input.scope, filtersB),
    ]);
    fulfillment = {
      overview: a.overview,
      overviewB: b.overview,
      compareGroupLabels: [ga.entity.label, gb.entity.label],
    };
    overviewReused = a.reused && b.reused;
    primaryQueryKey = a.queryKey;
  } else if (enrichedIntent.name === 'weakest_modules') {
    const structured = await getStructuredFromCacheOrFetch(
      queryClient,
      'average_grade',
      'module',
      executionFilters
    );
    fulfillment = { structuredRows: structured.rows, structuredMetric: 'average_grade' };
    const ov = await getOverviewFromCacheOrFetch(queryClient, input.scope, executionFilters);
    fulfillment.overview = ov.overview;
    overviewReused = ov.reused;
    primaryQueryKey = ov.queryKey;
  } else if (enrichedIntent.name === 'attendance_by_module') {
    const structured = await getStructuredFromCacheOrFetch(
      queryClient,
      'attendance_rate',
      'module',
      executionFilters
    );
    fulfillment = { structuredRows: structured.rows, structuredMetric: 'attendance_rate' };
    const ov = await getOverviewFromCacheOrFetch(queryClient, input.scope, executionFilters);
    fulfillment.overview = ov.overview;
    overviewReused = ov.reused;
    primaryQueryKey = ov.queryKey;
  } else if (enrichedIntent.name === 'top_students') {
    const structured = await getStructuredFromCacheOrFetch(
      queryClient,
      'average_grade',
      'student',
      executionFilters
    );
    fulfillment = {
      structuredRows: structured.rows,
      structuredMetric: 'average_grade',
    };
    const ov = await getOverviewFromCacheOrFetch(queryClient, input.scope, executionFilters);
    fulfillment.overview = ov.overview;
    overviewReused = ov.reused;
    primaryQueryKey = ov.queryKey;
  } else {
    const { overview, reused, queryKey } = await getOverviewFromCacheOrFetch(
      queryClient,
      input.scope,
      executionFilters
    );
    fulfillment = { overview, studentFilterStagiaireId };
    overviewReused = reused;
    primaryQueryKey = queryKey;
  }

  if (enrichedIntent.name !== 'students_at_risk') {
    fulfillment.studentFilterStagiaireId = undefined;
  } else {
    fulfillment.studentFilterStagiaireId = studentFilterStagiaireId;
  }

  const overview = fulfillment.overview;
  const latestTrend = overview?.charts.attendance_trends.at(-1);
  const previousTrend = overview?.charts.attendance_trends.at(-2);
  const comparisonDelta = latestTrend && previousTrend ? latestTrend.attendance_rate - previousTrend.attendance_rate : 0;

  let riskCount = overview?.ai.at_risk_students.length ?? 0;
  if (enrichedIntent.name === 'students_at_risk' && studentFilterStagiaireId != null && overview) {
    riskCount = overview.ai.at_risk_students.filter((s) => s.student_id === studentFilterStagiaireId).length;
  }

  const insights = composeInsightRecords(enrichedIntent, fulfillment);
  const recommendations = composeRecommendationRecords(enrichedIntent, fulfillment);

  const summary = buildDeterministicSummary({
    intent: enrichedIntent.name,
    riskCount,
    attendanceRate: overview?.kpis.attendance_rate ?? 0,
    averageGrade: overview?.kpis.average_grade ?? 0,
    comparisonDelta,
    fulfillment,
  });

  const guardrails = [
    'No raw SQL/database access from copilot layer.',
    'Entities resolved from scoped corpora + deterministic rules only.',
    'Structured queries use validated analytics metrics/dimensions only.',
    'No silent execution on ambiguous entities.',
  ];
  if (teacherResolved) {
    guardrails.push('Teacher entity captured for trace; overview KPIs remain role-scoped (no ad-hoc teacher filter).');
  }

  const response: CopilotResponse = {
    title: resolveCopilotTitle(enrichedIntent.name),
    summary,
    insights,
    recommendations,
    charts: composeCharts(enrichedIntent, fulfillment),
    metadata: {
      traceId: crypto.randomUUID(),
      generatedAt: new Date().toISOString(),
      intent: enrichedIntent.name,
      intentSource: enrichedIntent.source,
      scope: input.scope,
      cache: {
        reusedOverview: overviewReused,
        queryKey: primaryQueryKey,
      },
      resolved_entities: resolvedEntityTraces,
      guardrails,
    },
  };

  return { intent: enrichedIntent, response };
}

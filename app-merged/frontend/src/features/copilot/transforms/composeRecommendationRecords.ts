import type { CopilotFulfillmentContext, CopilotIntent, CopilotRecommendationRecord } from '../contracts';

function normalizePriority(label: string): CopilotRecommendationRecord['priority'] {
  if (/urgent|immediate|high/i.test(label)) return 'high';
  if (/monitor|follow|plan/i.test(label)) return 'medium';
  return 'low';
}

export function composeRecommendationRecords(
  intent: CopilotIntent,
  fulfillment: CopilotFulfillmentContext
): CopilotRecommendationRecord[] {
  const overview = fulfillment.overview;
  const base = (overview?.ai.recommendations ?? []).map((item, index) => ({
    id: `base-${index}`,
    label: item,
    reason: 'Derived from existing analytics recommendation engine.',
    priority: normalizePriority(item),
  })) satisfies CopilotRecommendationRecord[];

  if (intent.name === 'weakest_modules') {
    return [
      {
        id: 'weak-focus',
        label: 'Schedule remediation for the lowest-performing modules first.',
        priority: 'high',
        reason: 'Deterministic ranking from scoped grades by module.',
      },
      ...base,
    ].slice(0, 5);
  }

  if (intent.name === 'attendance_by_module') {
    return [
      {
        id: 'att-mod-followup',
        label: 'Target modules below the attendance health threshold for roll-call audits.',
        priority: 'medium',
        reason: 'Based on structured attendance by module.',
      },
      ...base,
    ].slice(0, 5);
  }

  if (intent.name === 'compare_groups') {
    return [
      {
        id: 'compare-groups-action',
        label: 'Align interventions with the group showing lower attendance or grades.',
        priority: 'medium',
        reason: 'Pairwise group KPI comparison from overview contract.',
      },
      ...base,
    ].slice(0, 5);
  }

  if (intent.name === 'compare_periods') {
    return [
      {
        id: 'comparison-review',
        label: 'Review attendance intervention actions from prior month and keep effective ones.',
        priority: 'medium',
        reason: 'Comparison intent requested trend-to-trend action.',
      },
      ...base,
    ].slice(0, 5);
  }

  if (intent.name === 'top_students') {
    return [
      {
        id: 'top-recognition',
        label: 'Recognize top performers and share study patterns with cohort peers.',
        priority: 'low',
        reason: 'Structured ranking from average_grade by student.',
      },
      ...base,
    ].slice(0, 5);
  }

  return base.slice(0, 5);
}

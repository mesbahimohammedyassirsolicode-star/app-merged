import type { CopilotFulfillmentContext, CopilotIntentName } from '../contracts';

const INTENT_TITLES: Record<CopilotIntentName, string> = {
  students_at_risk: 'Students At Risk Snapshot',
  attendance_trend: 'Attendance Trend Overview',
  compare_periods: 'Period Comparison',
  compare_groups: 'Group Comparison',
  attendance_by_module: 'Attendance By Module',
  top_students: 'Top Students Snapshot',
  weakest_modules: 'Weakest Modules Snapshot',
  overview: 'Analytics Overview',
};

export function resolveCopilotTitle(intent: CopilotIntentName): string {
  return INTENT_TITLES[intent];
}

export function buildDeterministicSummary(input: {
  intent: CopilotIntentName;
  riskCount: number;
  attendanceRate: number;
  averageGrade: number;
  comparisonDelta?: number;
  fulfillment: CopilotFulfillmentContext;
}): string {
  const { intent, riskCount, attendanceRate, averageGrade, comparisonDelta, fulfillment } = input;
  const { overview, overviewB, structuredRows, structuredMetric } = fulfillment;

  if (intent === 'compare_groups' && overview && overviewB) {
    const [la, lb] = fulfillment.compareGroupLabels ?? ['Group A', 'Group B'];
    return `${la}: ${overview.kpis.attendance_rate}% attendance, ${overview.kpis.average_grade}/20 avg grade. ${lb}: ${overviewB.kpis.attendance_rate}% attendance, ${overviewB.kpis.average_grade}/20 avg grade. All figures come from scoped overview queries.`;
  }

  if (intent === 'weakest_modules' && structuredRows?.length && structuredMetric === 'average_grade') {
    const sorted = [...structuredRows].sort((a, b) => (a.avg_grade ?? 0) - (b.avg_grade ?? 0));
    const worst = sorted[0];
    return `Lowest module average is ${worst?.label ?? 'n/a'} at ${worst?.avg_grade ?? 0}/20 (structured grades × module, role-scoped).`;
  }

  if (intent === 'attendance_by_module' && structuredRows?.length && structuredMetric === 'attendance_rate') {
    const sorted = [...structuredRows].sort((a, b) => (a.attendance_rate ?? 0) - (b.attendance_rate ?? 0));
    const worst = sorted[0];
    return `Lowest module attendance is ${worst?.label ?? 'n/a'} at ${worst?.attendance_rate ?? 0}% (structured attendance × module).`;
  }

  if (intent === 'top_students' && structuredRows?.length && structuredMetric === 'average_grade') {
    const sorted = [...structuredRows].sort((a, b) => (b.avg_grade ?? 0) - (a.avg_grade ?? 0));
    const best = sorted[0];
    return `Top student by average grade: ${best?.label ?? 'n/a'} (${best?.avg_grade ?? 0}/20) from structured student-level aggregation.`;
  }

  if (intent === 'students_at_risk') {
    return `${riskCount} students are currently flagged in this scope. Prioritize outreach for high-risk profiles first.`;
  }
  if (intent === 'attendance_trend') {
    return `Current attendance rate is ${attendanceRate.toFixed(1)}%. This summary is generated from the analytics cache, not free-form model output.`;
  }
  if (intent === 'compare_periods') {
    const delta = comparisonDelta ?? 0;
    const direction = delta >= 0 ? 'up' : 'down';
    return `Attendance is ${direction} by ${Math.abs(delta).toFixed(1)} points versus the comparison period.`;
  }
  if (intent === 'top_students') {
    return `Top students are ranked using existing risk and grade signals from analytics overview data.`;
  }
  if (intent === 'weakest_modules') {
    return 'Module averages could not be loaded from structured analytics.';
  }
  return `Overview metrics: attendance ${attendanceRate.toFixed(1)}%, average grade ${averageGrade.toFixed(2)}/20.`;
}

import type { CopilotFulfillmentContext, CopilotInsightRecord, CopilotIntent } from '../contracts';

function severityFromRiskScore(score: number): CopilotInsightRecord['severity'] {
  if (score >= 70) return 'critical';
  if (score >= 40) return 'warning';
  return 'neutral';
}

export function composeInsightRecords(intent: CopilotIntent, fulfillment: CopilotFulfillmentContext): CopilotInsightRecord[] {
  const { overview, overviewB, structuredRows, structuredMetric, studentFilterStagiaireId } = fulfillment;

  if (intent.name === 'compare_groups' && overview && overviewB) {
    const [la, lb] = fulfillment.compareGroupLabels ?? ['Group A', 'Group B'];
    return [
      {
        id: 'compare-groups-attendance',
        title: `${la}: ${overview.kpis.attendance_rate}% vs ${lb}: ${overviewB.kpis.attendance_rate}%`,
        detail: `Average grade: ${la} ${overview.kpis.average_grade}/20, ${lb} ${overviewB.kpis.average_grade}/20 (scoped overviews).`,
        severity:
          Math.abs(overview.kpis.attendance_rate - overviewB.kpis.attendance_rate) > 5 ? 'warning' : 'neutral',
        metric: 'attendance_rate',
      },
    ];
  }

  if (intent.name === 'weakest_modules' && structuredRows?.length && structuredMetric === 'average_grade') {
    const sorted = [...structuredRows].sort((a, b) => (a.avg_grade ?? 0) - (b.avg_grade ?? 0)).slice(0, 5);
    return sorted.map((row, i) => ({
      id: `weak-mod-${i}`,
      title: `${row.label}: ${row.avg_grade ?? 0}/20`,
      detail: 'From structured average_grade × module query (role-scoped).',
      severity: (row.avg_grade ?? 0) < 10 ? 'warning' : 'neutral',
      metric: 'average_grade',
    }));
  }

  if (intent.name === 'attendance_by_module' && structuredRows?.length && structuredMetric === 'attendance_rate') {
    const sorted = [...structuredRows].sort((a, b) => (a.attendance_rate ?? 0) - (b.attendance_rate ?? 0)).slice(0, 5);
    return sorted.map((row, i) => ({
      id: `att-mod-${i}`,
      title: `${row.label}: ${row.attendance_rate ?? 0}%`,
      detail: 'From structured attendance_rate × module query (role-scoped).',
      severity: (row.attendance_rate ?? 0) < 75 ? 'warning' : 'positive',
      metric: 'attendance_rate',
    }));
  }

  if (intent.name === 'top_students' && structuredRows?.length && structuredMetric === 'average_grade') {
    const sorted = [...structuredRows].sort((a, b) => (b.avg_grade ?? 0) - (a.avg_grade ?? 0)).slice(0, 5);
    return sorted.map((row, i) => ({
      id: `top-${i}`,
      title: `${row.label}: ${row.avg_grade ?? 0}/20`,
      detail: 'From structured average_grade × student query (deterministic sort).',
      severity: 'positive',
      metric: 'average_grade',
    }));
  }

  if (intent.name === 'top_students' && overview) {
    const rows = [...overview.ai.at_risk_students]
      .sort((a, b) => b.average_grade - a.average_grade)
      .slice(0, 5);
    if (rows.length === 0) {
      return [
        {
          id: 'top-empty',
          title: 'No ranked students in fallback cohort',
          detail: 'Structured student query returned no rows and overview at-risk list is empty.',
          severity: 'neutral',
        },
      ];
    }
    return rows.map((student) => ({
      id: `top-${student.student_id}`,
      title: `${student.student_name} (${student.average_grade}/20)`,
      detail: `Attendance ${student.attendance_rate}% | Risk ${student.risk_level} (fallback: overview cohort).`,
      severity: 'positive',
      metric: 'average_grade',
    }));
  }

  if (intent.name === 'weakest_modules' && (!structuredRows || structuredRows.length === 0)) {
    return [
      {
        id: 'weakest-empty',
        title: 'No module rows returned',
        detail: 'Structured average_grade × module query returned an empty result for this scope and period.',
        severity: 'neutral',
      },
    ];
  }

  if (intent.name === 'attendance_by_module' && (!structuredRows || structuredRows.length === 0)) {
    return [
      {
        id: 'att-mod-empty',
        title: 'No module attendance rows',
        detail: 'Structured attendance_rate × module query returned an empty result for this scope and period.',
        severity: 'neutral',
      },
    ];
  }

  if (!overview) {
    return [
      {
        id: 'no-overview',
        title: 'No overview payload',
        detail: 'This intent used structured analytics only.',
        severity: 'neutral',
      },
    ];
  }

  if (intent.name === 'students_at_risk') {
    let list = overview.ai.at_risk_students;
    if (studentFilterStagiaireId != null) {
      list = list.filter((s) => s.student_id === studentFilterStagiaireId);
    }
    return list.slice(0, 5).map((student) => ({
      id: `risk-${student.student_id}`,
      title: `${student.student_name} (${student.risk_score})`,
      detail: student.explanation,
      severity: severityFromRiskScore(student.risk_score),
      metric: 'risk_score',
    }));
  }

  if (intent.name === 'attendance_trend' || intent.name === 'compare_periods') {
    const latest = overview.charts.attendance_trends.at(-1);
    const previous = overview.charts.attendance_trends.at(-2);
    const delta = latest && previous ? latest.attendance_rate - previous.attendance_rate : 0;

    return [
      {
        id: 'attendance-latest',
        title: `Latest attendance: ${latest?.attendance_rate ?? overview.kpis.attendance_rate}%`,
        detail: `Absent count in latest period: ${latest?.absent_count ?? 0}.`,
        severity: delta < -3 ? 'warning' : 'positive',
        metric: 'attendance_rate',
      },
    ];
  }

  return [
    {
      id: 'overview-attendance',
      title: `Attendance: ${overview.kpis.attendance_rate}%`,
      detail: `Average grade: ${overview.kpis.average_grade}/20`,
      severity: 'neutral',
    },
  ];
}

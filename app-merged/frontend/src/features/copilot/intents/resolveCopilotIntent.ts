import type { AnalyticsFiltersContract } from '../../analytics/contracts';
import type { CopilotEntityMentions, CopilotIntent, CopilotIntentName, CopilotMemoryState, CopilotTimeRangePreset } from '../contracts';

const MONTH_PATTERN = /\b(this month|current month|ce mois)\b/i;
const LAST_MONTH_PATTERN = /\b(last month|previous month|mois dernier)\b/i;
const THIS_YEAR_PATTERN = /\b(this year|current year|cette annee|cette année)\b/i;
const COMPARE_PATTERN = /\b(compare|comparison|vs|versus|with last month|against last month)\b/i;
const RISK_PATTERN = /\b(students?\s+at\s+risk|at\s+risk|risk students?)\b/i;
const ATTENDANCE_PATTERN = /\b(attendance|presence|présence)\b/i;
const TOP_STUDENTS_PATTERN = /\b(top students?|best students?|highest grades?)\b/i;
const WEAKEST_MODULES_PATTERN = /\b(weakest modules?|lowest modules?|modules?\s+with\s+lowest)\b/i;
const ONLY_PATTERN = /\bonly\b/i;
const MODULE_CODE_PATTERN = /\b([A-Z]{2,}\d{2,})\b/;
const GROUP_ID_PATTERN = /\bgroup\s+(\d+)\b/i;
const MODULE_ID_PATTERN = /\bmodule\s+(\d+)\b/i;
const COMPARE_GROUPS_PATTERN =
  /\bcompare\s+(?:group(?:s|es)?|groupe(?:s)?\s+)?(.+?)\s+(?:and|vs\.?|versus|avec|with)\s+(?:group(?:s|es)?|groupe(?:s)?\s+)?(.+)/i;

function isCompareGroupsIntent(query: string): boolean {
  const m = query.match(COMPARE_GROUPS_PATTERN);
  if (!m) return false;
  const left = m[1].trim();
  const right = m[2].trim();
  const timeOnly = /\b(this|last|current|previous)\s+(month|year|week)\b/i.test(`${left} ${right}`);
  if (timeOnly) return false;
  const looksLikeGroup = (s: string) =>
    /\b(group|groupe)\b/i.test(s) ||
    /^\d+$/.test(s) ||
    /^[A-Z0-9][A-Za-z0-9\s\-]{0,48}$/.test(s);
  return looksLikeGroup(left) && looksLikeGroup(right);
}
const ATTENDANCE_BY_MODULE_PATTERN =
  /\b(attendance|presence|présence).{0,60}\b(by\s+module|per\s+module|each\s+module|modules?)\b/i;

function normalizeQuery(input: string): string {
  return input.trim().replace(/\s+/g, ' ');
}

function extractEntityMentions(query: string, intentName: CopilotIntentName, memory: CopilotMemoryState): CopilotEntityMentions {
  const mentions: CopilotEntityMentions = {};

  if (intentName === 'compare_groups') {
    const cg = query.match(COMPARE_GROUPS_PATTERN);
    if (cg) {
      mentions.groupA = cg[1].trim();
      mentions.groupB = cg[2].trim();
    }
  }

  const codeMatch = query.match(MODULE_CODE_PATTERN);
  if (codeMatch) {
    mentions.moduleCode = codeMatch[1].toUpperCase();
  }

  const inCode = query.match(/\bin\s+([A-Z]{2,}\d{2,})\b/i);
  if (inCode) {
    mentions.moduleCode = inCode[1].toUpperCase();
  }

  if (!mentions.moduleCode && (intentName === 'top_students' || intentName === 'weakest_modules')) {
    const quoted = query.match(/\bin\s+["']([^"']+)["']/i);
    if (quoted) {
      mentions.moduleRaw = quoted[1].trim();
    }
  }

  const studentMatch =
    query.match(/\b(?:for|stagiaire)\s+["']?([A-Za-zÀ-ÿ][^"'\n,?]{2,40})/i) ||
    query.match(/\bstudent\s+["']?([A-Za-zÀ-ÿ][^"'\n,?]{2,40})/i);
  if (studentMatch) {
    mentions.studentRaw = studentMatch[1].trim();
  }

  const teacherMatch = query.match(/\b(?:teacher|formateur)\s+["']?([A-Za-zÀ-ÿ][^"'\n,?]{2,40})/i);
  if (teacherMatch) {
    mentions.teacherRaw = teacherMatch[1].trim();
  }

  if (!mentions.moduleCode && memory.lastModuleCode) {
    if (ONLY_PATTERN.test(query)) {
      mentions.moduleCode = memory.lastModuleCode;
    }
  }

  return mentions;
}

function resolveIntentName(query: string): CopilotIntentName {
  if (isCompareGroupsIntent(query)) {
    return 'compare_groups';
  }
  if (RISK_PATTERN.test(query)) {
    return 'students_at_risk';
  }
  if (ATTENDANCE_PATTERN.test(query) && ATTENDANCE_BY_MODULE_PATTERN.test(query)) {
    return 'attendance_by_module';
  }
  if (ATTENDANCE_PATTERN.test(query) && COMPARE_PATTERN.test(query)) {
    return 'compare_periods';
  }
  if (ATTENDANCE_PATTERN.test(query)) {
    return 'attendance_trend';
  }
  if (TOP_STUDENTS_PATTERN.test(query)) {
    return 'top_students';
  }
  if (WEAKEST_MODULES_PATTERN.test(query)) {
    return 'weakest_modules';
  }
  if (COMPARE_PATTERN.test(query)) {
    return 'compare_periods';
  }
  return 'overview';
}

function resolveTimeRange(
  query: string,
  memory: CopilotMemoryState,
  intentName: CopilotIntentName
): CopilotIntent['timeRange'] {
  if (intentName === 'compare_groups') {
    if (MONTH_PATTERN.test(query)) return { preset: 'this_month' };
    if (LAST_MONTH_PATTERN.test(query)) return { preset: 'last_month' };
    if (THIS_YEAR_PATTERN.test(query)) return { preset: 'this_year' };
    return { preset: memory.lastTimeRangePreset ?? 'none' };
  }
  if (MONTH_PATTERN.test(query)) {
    return { preset: 'this_month' };
  }
  if (LAST_MONTH_PATTERN.test(query)) {
    return { preset: 'last_month' };
  }
  if (THIS_YEAR_PATTERN.test(query)) {
    return { preset: 'this_year' };
  }
  if (COMPARE_PATTERN.test(query)) {
    return {
      preset: 'this_month',
      comparison: { preset: 'last_month' },
    };
  }
  return { preset: memory.lastTimeRangePreset ?? 'none' };
}

function extractFilters(query: string, memory: CopilotMemoryState): {
  filters: AnalyticsFiltersContract;
  moduleCode?: string;
} {
  const filters: AnalyticsFiltersContract = {};
  const moduleIdMatch = query.match(MODULE_ID_PATTERN);
  const groupIdMatch = query.match(GROUP_ID_PATTERN);
  const moduleCodeMatch = query.match(MODULE_CODE_PATTERN);

  if (moduleIdMatch) {
    filters.module_id = Number(moduleIdMatch[1]);
  }
  if (groupIdMatch) {
    filters.group_id = Number(groupIdMatch[1]);
  }

  if ((ONLY_PATTERN.test(query) || moduleCodeMatch) && !filters.module_id && memory.lastFilters.module_id) {
    filters.module_id = memory.lastFilters.module_id;
  }
  if (!filters.group_id && ONLY_PATTERN.test(query) && memory.lastFilters.group_id) {
    filters.group_id = memory.lastFilters.group_id;
  }

  return { filters, moduleCode: moduleCodeMatch?.[1] ?? memory.lastModuleCode };
}

function toDateRange(preset: CopilotTimeRangePreset): { date_from?: string; date_to?: string } {
  const now = new Date();
  if (preset === 'none') {
    return {};
  }

  if (preset === 'this_month') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    return { date_from: from.toISOString().slice(0, 10), date_to: now.toISOString().slice(0, 10) };
  }

  if (preset === 'last_month') {
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const to = new Date(now.getFullYear(), now.getMonth(), 0);
    return { date_from: from.toISOString().slice(0, 10), date_to: to.toISOString().slice(0, 10) };
  }

  if (preset === 'this_year') {
    const from = new Date(now.getFullYear(), 0, 1);
    return { date_from: from.toISOString().slice(0, 10), date_to: now.toISOString().slice(0, 10) };
  }

  return {};
}

export function resolveCopilotIntent(rawInput: string, memory: CopilotMemoryState): CopilotIntent {
  const query = normalizeQuery(rawInput);
  const intentName = resolveIntentName(query);
  const timeRange = resolveTimeRange(query, memory, intentName);
  const { filters, moduleCode } = extractFilters(query, memory);
  const dateRange = toDateRange(timeRange.preset);
  const entityMentions = extractEntityMentions(query, intentName, memory);

  const mergedModuleCode = entityMentions.moduleCode ?? moduleCode;

  return {
    name: intentName,
    source: 'rule',
    confidence: 1,
    rawQuery: query,
    moduleCode: mergedModuleCode,
    filters: {
      ...memory.lastFilters,
      ...filters,
      ...dateRange,
    },
    timeRange: {
      ...timeRange,
      dateFrom: dateRange.date_from,
      dateTo: dateRange.date_to,
    },
    entityMentions,
  };
}

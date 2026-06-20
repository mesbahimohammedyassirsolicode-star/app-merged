import { useMemo } from 'react';
import type { AnalyticsFiltersContract, RankedAtRiskStudentContract } from '../contracts';
import { rankAtRiskStudents } from '../transforms/risk-scoring';
import { useAnalyticsOverview, type AnalyticsScope } from './useAnalyticsOverview';

interface UseStudentsAtRiskWidgetOptions {
  scope: AnalyticsScope;
  filters?: AnalyticsFiltersContract;
  limit?: number;
}

interface UseStudentsAtRiskWidgetResult {
  students: RankedAtRiskStudentContract[];
  recommendations: string[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

export function useStudentsAtRiskWidget({
  scope,
  filters,
  limit = 5,
}: UseStudentsAtRiskWidgetOptions): UseStudentsAtRiskWidgetResult {
  const query = useAnalyticsOverview(scope, filters);

  const students = useMemo(
    () => rankAtRiskStudents(query.data?.ai.at_risk_students ?? [], { limit }),
    [query.data?.ai.at_risk_students, limit]
  );

  return {
    students,
    recommendations: query.data?.ai.recommendations ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
  };
}

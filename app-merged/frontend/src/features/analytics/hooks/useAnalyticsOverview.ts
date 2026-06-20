import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../../../api/api/analytics';
import { queryKeys } from '../../../lib/query-keys';
import type { AnalyticsFiltersContract } from '../contracts';

export type AnalyticsScope = 'admin' | 'teacher' | 'parent';

export function useAnalyticsOverview(scope: AnalyticsScope, filters?: AnalyticsFiltersContract) {
  return useQuery({
    queryKey: queryKeys.analytics.overview(scope, filters),
    queryFn: () => analyticsApi.overview(filters),
    staleTime: 5 * 60 * 1000,
  });
}

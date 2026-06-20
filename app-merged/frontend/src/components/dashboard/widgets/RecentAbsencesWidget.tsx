import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../../../api/dashboardService';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { EmptyState } from '../../ui/empty-state';
import { ListSkeleton } from '../../ui/loading-skeleton';
import { ErrorBoundary } from '../../ui/error-boundary';

function RecentAbsencesWidgetContent() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['dashboard', 'admin', 'recent-absences'],
        queryFn: dashboardService.getRecentAbsences,
        staleTime: 5 * 60 * 1000, // 5 minutes cache
    });

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Absence par groupe/module</CardTitle>
                </CardHeader>
                <CardContent>
                    <ListSkeleton rows={4} />
                </CardContent>
            </Card>
        );
    }

    if (error) {
        throw error; // Let the ErrorBoundary catch it
    }

    const absences = data?.absence_rate_by_group_module || [];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Absence par groupe/module</CardTitle>
            </CardHeader>
            <CardContent>
                {absences.length > 0 ? (
                    <ul className="max-h-64 space-y-2 overflow-y-auto">
                        {absences.map((row) => (
                            <li
                                key={`${row.group_id}-${row.module_id}`}
                                className="flex items-center justify-between rounded-xl border border-theme-border bg-theme-surface/50 px-4 py-3 text-sm"
                            >
                                <div>
                                    <p className="font-medium text-theme-text-primary">
                                        {row.module_code} - {row.module_label}
                                    </p>
                                    <p className="text-theme-text-secondary">{row.group_label}</p>
                                </div>
                                <span
                                    className={
                                        row.is_risk
                                            ? 'font-semibold text-amber-600'
                                            : 'font-semibold text-theme-text-primary'
                                    }
                                >
                                    {row.absence_rate_percent}%
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <EmptyState
                        title="No data available"
                        description="Aucune donnée d'absence disponible."
                    />
                )}
            </CardContent>
        </Card>
    );
}

export function RecentAbsencesWidget() {
    return (
        <ErrorBoundary>
            <RecentAbsencesWidgetContent />
        </ErrorBoundary>
    );
}

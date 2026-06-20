import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { dashboardService } from '../../../api/dashboardService';
import type { AdminDashboardData } from '../../../api/dashboardService';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { EmptyState } from '../../ui/empty-state';
import { ChartSkeleton } from '../../ui/loading-skeleton';
import { ErrorBoundary } from '../../ui/error-boundary';

// We isolate the pure chart to prevent unnecessary re-renders when parent components update
const TrendChart = React.memo(({ data }: { data: AdminDashboardData['attendance']['monthly_summary'] }) => {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgb(var(--theme-border))" />
                <XAxis dataKey="month" tick={{ fill: 'rgb(var(--theme-text-secondary))', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgb(var(--theme-text-secondary))', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgb(var(--theme-surface-muted))' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="absence_rate_percent" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
});
TrendChart.displayName = 'TrendChart';

function AttendanceTrendWidgetContent() {
    const { data: trendData, isLoading, error } = useQuery({
        // We omit the user ID here to match the dashboard's generic query, 
        // or we use a more generic admin key. In DashboardPage it uses ['dashboard', user?.id]
        // Since we want this to be isolated and we know it's for admin, we fetch the admin dashboard
        // If the cache matches ['dashboard', 'admin'], it's instant. If not, it fetches isolated.
        queryKey: ['dashboard', 'admin'],
        queryFn: () => dashboardService.getDashboard('admin'),
        select: (response) => {
            const data = response.data as AdminDashboardData;
            const summary = data?.attendance?.monthly_summary;
            if (!Array.isArray(summary)) return [];
            
            // Validate data structure to prevent Recharts from crashing
            return summary.filter(item => 
                item && 
                typeof item.month === 'string' && 
                typeof item.absence_rate_percent === 'number'
            );
        },
        staleTime: 5 * 60 * 1000,
    });

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Résumé mensuel (absence %)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-64">
                        <ChartSkeleton />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        throw error;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Résumé mensuel (absence %)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-64">
                    {trendData && trendData.length > 0 ? (
                        <TrendChart data={trendData} />
                    ) : (
                        <EmptyState title="No data available" description="Aucune donnée de résumé mensuel." />
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export function AttendanceTrendWidget() {
    return (
        <ErrorBoundary>
            <AttendanceTrendWidgetContent />
        </ErrorBoundary>
    );
}

import { useNavigate } from 'react-router-dom';
import { Users, AlertTriangle, GraduationCap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { ParentDashboardData } from '../../api/dashboardService';
import { parentApi } from '../../api/api/parent';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { EmptyState } from '../ui/empty-state';
import { ListSkeleton } from '../ui/loading-skeleton';
import { StatCard } from './StatCard';
import { useAnalyticsOverview } from '../../features/analytics/hooks/useAnalyticsOverview';

interface ParentDashboardProps {
    data: ParentDashboardData;
    userName: string;
}

export default function ParentDashboard({ data, userName }: ParentDashboardProps) {
    const navigate = useNavigate();
    const { alerts, attendance } = data;
    const { data: stagiaires, isLoading: isLoadingStagiaires } = useQuery({
        queryKey: ['parent', 'stagiaires', 'dashboard'],
        queryFn: parentApi.getStagiaires,
    });
    const { data: analytics, isLoading: isLoadingAnalytics } = useAnalyticsOverview('parent');
    const total = stagiaires?.length ?? 0;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-theme-text-primary">Espace parent</h1>
                <p className="mt-1 text-sm text-theme-text-secondary">Bienvenue, {userName}.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard
                    title="Total stagiaires"
                    value={isLoadingStagiaires ? '...' : total}
                    icon={<Users className="h-6 w-6" />}
                    colorTheme="indigo"
                    delay={0.1}
                />
                <StatCard
                    title="Taux de presence"
                    value={isLoadingAnalytics ? '...' : `${analytics?.kpis.attendance_rate ?? 0}%`}
                    icon={<GraduationCap className="h-6 w-6" />}
                    colorTheme="emerald"
                    delay={0.2}
                />
            </div>

            {alerts?.length > 0 && (
                <div className="flex items-start rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
                    <AlertTriangle className="mr-3 mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    <div>
                        <h3 className="font-medium text-amber-900">Alertes présence</h3>
                        <p className="mt-1 text-sm text-amber-400">
                            {alerts.length} enfant(s) avec un taux de présence &lt; 80 % (à risque).
                        </p>
                        <ul className="mt-2 space-y-1 text-sm text-amber-400">
                            {alerts.map((c) => (
                                <li key={c.id}>
                                    {c.name} — {c.attendance_percent ?? 0}%
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            <Card className="border-theme-border shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <GraduationCap className="h-5 w-5 text-indigo-400" aria-hidden />
                        Mes stagiaires
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoadingStagiaires ? (
                        <ListSkeleton rows={2} />
                    ) : total > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            {stagiaires?.map((child) => (
                                <Card
                                    key={child.id}
                                    className="cursor-pointer border-theme-border transition hover:border-primary-200 hover:shadow-md"
                                    onClick={() => navigate(`/parent/children/${child.id}`)}
                                >
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base font-semibold text-theme-text-primary">{child.name ?? '—'}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2 text-sm text-theme-text-secondary">
                                        <p>
                                            <span className="font-medium text-theme-text-primary">Filière:</span> {child.filiere ?? '—'}
                                        </p>
                                        <p>
                                            <span className="font-medium text-theme-text-primary">Groupe:</span> {child.groupe ?? '—'}
                                        </p>
                                        <div>
                                            <p className="font-medium text-theme-text-primary">Modules:</p>
                                            {child.modules.length > 0 ? (
                                                <ul className="mt-1 flex flex-wrap gap-2">
                                                    {child.modules.map((moduleName) => (
                                                        <li
                                                            key={`${child.id}-${moduleName}`}
                                                            className="rounded-full bg-slate-700/30 px-2.5 py-0.5 text-xs font-medium text-theme-text-primary"
                                                        >
                                                            {moduleName}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="mt-1 text-xs text-theme-text-secondary">Aucun module disponible</p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            title="No children found"
                            description="Aucun stagiaire lié à ce compte parent pour le moment."
                        />
                    )}
                </CardContent>
            </Card>

            <Card className="border-theme-border shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base">Vue présence (mois en cours)</CardTitle>
                </CardHeader>
                <CardContent>
                    {attendance.child_overview?.length > 0 ? (
                        <ul className="space-y-2">
                            {attendance.child_overview.map((row) => (
                                <li
                                    key={row.child_id}
                                    className="rounded-lg border border-theme-border px-3 py-2 text-sm"
                                >
                                    <div className="flex justify-between">
                                        <span className="font-medium text-theme-text-primary">{row.child_name}</span>
                                        <span
                                            className={
                                                row.is_risk
                                                    ? 'font-semibold text-amber-600'
                                                    : 'font-semibold text-emerald-400'
                                            }
                                        >
                                            {row.monthly_summary.attendance_rate_percent}%
                                        </span>
                                    </div>
                                    <p className="mt-1 text-theme-text-secondary">
                                        Absents : {row.monthly_summary.absent_count} /{' '}
                                        {row.monthly_summary.total_count}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <EmptyState
                            title="Pas de données de présence"
                            description="Les statistiques mensuelles s’afficheront lorsque des enregistrements seront disponibles."
                        />
                    )}
                </CardContent>
            </Card>

            <Card className="border-theme-border shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base">Raccourcis</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-3">
                        <Button onClick={() => navigate('/parent/children')}>Liste des stagiaires</Button>
                    </div>
                    {analytics?.ai.recommendations?.length ? (
                        <div className="mt-4 rounded-lg border border-indigo-200 bg-indigo-500/10 p-3">
                            <p className="text-sm font-semibold text-indigo-900">Recommandations intelligentes</p>
                            <ul className="mt-2 space-y-1 text-xs text-indigo-400">
                                {analytics.ai.recommendations.map((recommendation) => (
                                    <li key={recommendation}>- {recommendation}</li>
                                ))}
                            </ul>
                        </div>
                    ) : null}
                </CardContent>
            </Card>
        </div>
    );
}

import { useNavigate } from 'react-router-dom';
import { Users, AlertTriangle, GraduationCap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { ParentDashboardData } from '../../api/dashboardService';
import { parentApi } from '../../api/api/parent';
import { analyticsApi } from '../../api/api/analytics';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { EmptyState } from '../ui/empty-state';
import { Loader2 } from 'lucide-react';

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
    const { data: analytics } = useQuery({
        queryKey: ['analytics', 'parent-overview'],
        queryFn: () => analyticsApi.overview(),
    });
    const total = stagiaires?.length ?? 0;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Espace parent</h1>
                <p className="mt-1 text-sm text-slate-600">Bienvenue, {userName}.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-700">Total stagiaires</CardTitle>
                        <Users className="h-5 w-5 text-indigo-600" aria-hidden />
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-semibold tracking-tight text-slate-900">{total}</p>
                        <p className="mt-1 text-xs text-slate-500">Comptes liés à votre profil</p>
                    </CardContent>
                </Card>
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-700">Taux de présence</CardTitle>
                        <Users className="h-5 w-5 text-emerald-600" aria-hidden />
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-semibold tracking-tight text-slate-900">{analytics?.kpis.attendance_rate ?? 0}%</p>
                        <p className="mt-1 text-xs text-slate-500">Moyenne enfants suivis</p>
                    </CardContent>
                </Card>
            </div>

            {alerts?.length > 0 && (
                <div className="flex items-start rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <AlertTriangle className="mr-3 mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    <div>
                        <h3 className="font-medium text-amber-900">Alertes présence</h3>
                        <p className="mt-1 text-sm text-amber-800">
                            {alerts.length} enfant(s) avec un taux de présence &lt; 80 % (à risque).
                        </p>
                        <ul className="mt-2 space-y-1 text-sm text-amber-800">
                            {alerts.map((c) => (
                                <li key={c.id}>
                                    {c.name} — {c.attendance_percent ?? 0}%
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <GraduationCap className="h-5 w-5 text-indigo-600" aria-hidden />
                        Mes stagiaires
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoadingStagiaires ? (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 className="h-7 w-7 animate-spin text-primary-600" />
                        </div>
                    ) : total > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            {stagiaires?.map((child) => (
                                <Card
                                    key={child.id}
                                    className="cursor-pointer border-slate-200 transition hover:border-primary-200 hover:shadow-md"
                                    onClick={() => navigate(`/parent/children/${child.id}`)}
                                >
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base font-semibold text-slate-900">{child.name ?? '—'}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2 text-sm text-slate-600">
                                        <p>
                                            <span className="font-medium text-slate-800">Filière:</span> {child.filiere ?? '—'}
                                        </p>
                                        <p>
                                            <span className="font-medium text-slate-800">Groupe:</span> {child.groupe ?? '—'}
                                        </p>
                                        <div>
                                            <p className="font-medium text-slate-800">Modules:</p>
                                            {child.modules.length > 0 ? (
                                                <ul className="mt-1 flex flex-wrap gap-2">
                                                    {child.modules.map((moduleName) => (
                                                        <li
                                                            key={`${child.id}-${moduleName}`}
                                                            className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700"
                                                        >
                                                            {moduleName}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="mt-1 text-xs text-slate-400">Aucun module disponible</p>
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

            <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base">Vue présence (mois en cours)</CardTitle>
                </CardHeader>
                <CardContent>
                    {attendance.child_overview?.length > 0 ? (
                        <ul className="space-y-2">
                            {attendance.child_overview.map((row) => (
                                <li
                                    key={row.child_id}
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                >
                                    <div className="flex justify-between">
                                        <span className="font-medium text-slate-800">{row.child_name}</span>
                                        <span
                                            className={
                                                row.is_risk
                                                    ? 'font-semibold text-amber-600'
                                                    : 'font-semibold text-emerald-700'
                                            }
                                        >
                                            {row.monthly_summary.attendance_rate_percent}%
                                        </span>
                                    </div>
                                    <p className="mt-1 text-slate-500">
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

            <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base">Raccourcis</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-3">
                        <Button onClick={() => navigate('/parent/children')}>Liste des stagiaires</Button>
                    </div>
                    {analytics?.ai.recommendations?.length ? (
                        <div className="mt-4 rounded-lg border border-indigo-200 bg-indigo-50 p-3">
                            <p className="text-sm font-semibold text-indigo-900">Recommandations intelligentes</p>
                            <ul className="mt-2 space-y-1 text-xs text-indigo-800">
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

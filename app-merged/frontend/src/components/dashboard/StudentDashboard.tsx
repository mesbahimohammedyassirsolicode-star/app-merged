import { useNavigate } from 'react-router-dom';
import { Calendar, TrendingUp, Award, AlertTriangle } from 'lucide-react';
import type { StudentDashboardData } from '../../api/dashboardService';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { EmptyState } from '../ui/empty-state';
import { StatCard } from './StatCard';

interface StudentDashboardProps {
    data: StudentDashboardData;
    userName: string;
}

export default function StudentDashboard({ data, userName }: StudentDashboardProps) {
    const navigate = useNavigate();
    const { filiere, groupe, syllabus_progress, latest_grades, attendance, quick_actions } = data;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-theme-text-primary">Tableau de bord - Stagiaire</h1>
                <p className="mt-1 text-sm text-theme-text-secondary">Bienvenue, {userName}.</p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="md:col-span-2">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Ma formation</CardTitle>
                        </CardHeader>
                        <CardContent>
                        {filiere && groupe ? (
                            <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-8 sm:space-y-0">
                                <div>
                                    <p className="text-sm font-medium text-theme-text-secondary">Filiere</p>
                                    <p className="mt-1 text-lg font-semibold text-theme-text-primary">{filiere.code} - {filiere.label}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-theme-text-secondary">Groupe</p>
                                    <p className="mt-1 text-lg font-semibold text-theme-text-primary">{groupe.label}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-amber-400">Aucune filiere ou groupe assigne. Contactez l'administration.</p>
                        )}
                        </CardContent>
                    </Card>
                </div>
                <div className="md:col-span-1">
                    <StatCard
                        title="Taux de presence"
                        value={`${attendance.monthly_summary.attendance_rate_percent}%`}
                        icon={<TrendingUp className="h-6 w-6" />}
                        colorTheme={attendance.is_risk ? 'orange' : 'emerald'}
                    />
                </div>
            </div>

            {attendance.is_risk && (
                <div className="flex items-start rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
                    <AlertTriangle className="mr-3 mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    <div>
                        <h3 className="font-medium text-amber-900">Risque d'absence</h3>
                        <p className="text-sm text-amber-400 mt-1">
                            Taux de presence mensuel: {attendance.monthly_summary.attendance_rate_percent}%
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                        <TrendingUp className="mr-2 h-5 w-5 text-indigo-400" />
                        Progression du syllabus
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                    {syllabus_progress?.length > 0 ? (
                        <ul className="space-y-3">
                            {syllabus_progress.map((p, i) => (
                                <li key={i} className="flex items-center justify-between rounded-lg border border-theme-border px-3 py-2">
                                    <span className="text-sm text-theme-text-primary">{p.module}</span>
                                    <span className="font-medium text-theme-text-primary">{p.progress_percent}%</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <EmptyState title="No data available" description="Aucune progression enregistree." />
                    )}
                    <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/progress')}>
                        Voir la progression
                    </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                        <Award className="mr-2 h-5 w-5 text-indigo-400" />
                        Dernieres notes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                    {latest_grades?.length > 0 ? (
                        <ul className="space-y-2">
                            {latest_grades.slice(0, 5).map((g, i) => (
                                <li key={i} className="flex justify-between rounded-lg border border-theme-border px-3 py-2 text-sm">
                                    <span className="text-theme-text-primary">{g.evaluation} ({g.module})</span>
                                    <span className="font-medium text-theme-text-primary">{g.value}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <EmptyState title="No data available" description="Aucune note pour le moment." />
                    )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Resume presence (mois en cours)</CardTitle>
                    </CardHeader>
                    <CardContent>
                    <ul className="space-y-2 text-sm">
                        <li className="flex justify-between rounded-lg border border-theme-border px-3 py-2"><span>Total</span><span className="font-medium">{attendance.monthly_summary.total_count}</span></li>
                        <li className="flex justify-between rounded-lg border border-theme-border px-3 py-2"><span>Presents</span><span className="font-medium text-emerald-400">{attendance.monthly_summary.present_count}</span></li>
                        <li className="flex justify-between rounded-lg border border-theme-border px-3 py-2"><span>Absents</span><span className="font-medium text-red-400">{attendance.monthly_summary.absent_count}</span></li>
                        <li className="flex justify-between rounded-lg border border-theme-border px-3 py-2"><span>Retards</span><span className="font-medium text-amber-400">{attendance.monthly_summary.late_count}</span></li>
                        <li className="flex justify-between rounded-lg border border-theme-border bg-theme-surface px-3 py-2"><span>Taux de presence</span><span className="font-semibold">{attendance.monthly_summary.attendance_rate_percent}%</span></li>
                    </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Historique de presence</CardTitle>
                    </CardHeader>
                    <CardContent>
                    {attendance.history?.length > 0 ? (
                        <ul className="max-h-64 space-y-2 overflow-y-auto text-sm">
                            {attendance.history.slice(0, 10).map((h) => (
                                <li key={h.id} className="flex items-center justify-between rounded-lg border border-theme-border px-3 py-2">
                                    <div>
                                        <p className="font-medium text-theme-text-primary">{h.module?.code} - {h.module?.label}</p>
                                        <p className="text-theme-text-secondary">{h.group?.label} - {h.date}</p>
                                    </div>
                                    <span className={h.status === 'absent' ? 'text-red-600 font-medium' : h.status === 'late' ? 'text-amber-600 font-medium' : 'text-emerald-400 font-medium'}>
                                        {h.status}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <EmptyState title="No data available" description="Aucun historique de presence." />
                    )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Raccourcis</CardTitle>
                </CardHeader>
                <CardContent>
                <div className="flex flex-wrap gap-3">
                    {quick_actions.map((a) => (
                        <Button key={a.path} variant="outline" onClick={() => navigate(a.path)}>
                            {a.label}
                        </Button>
                    ))}
                    <Button onClick={() => navigate('/timetable')}>
                        <Calendar className="mr-2 h-4 w-4" />
                        Emploi du temps
                    </Button>
                </div>
                </CardContent>
            </Card>
        </div>
    );
}

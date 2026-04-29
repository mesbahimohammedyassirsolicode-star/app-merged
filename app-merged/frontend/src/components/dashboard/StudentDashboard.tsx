import { useNavigate } from 'react-router-dom';
import { Calendar, TrendingUp, Award, AlertTriangle } from 'lucide-react';
import type { StudentDashboardData } from '../../api/dashboardService';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { EmptyState } from '../ui/empty-state';

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
                <h1 className="text-2xl font-bold text-slate-900">Tableau de bord - Stagiaire</h1>
                <p className="mt-1 text-sm text-slate-600">Bienvenue, {userName}.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Ma formation</CardTitle>
                </CardHeader>
                <CardContent>
                {filiere && groupe ? (
                    <p className="text-slate-600">
                        <span className="font-medium">Filiere :</span> {filiere.code} - {filiere.label}
                        <span className="mx-2">|</span>
                        <span className="font-medium">Groupe :</span> {groupe.label}
                    </p>
                ) : (
                    <p className="text-amber-700">Aucune filiere ou groupe assigne. Contactez l'administration.</p>
                )}
                </CardContent>
            </Card>

            {attendance.is_risk && (
                <div className="flex items-start rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <AlertTriangle className="mr-3 mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    <div>
                        <h3 className="font-medium text-amber-900">Risque d'absence</h3>
                        <p className="text-sm text-amber-800 mt-1">
                            Taux de presence mensuel: {attendance.monthly_summary.attendance_rate_percent}%
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                        <TrendingUp className="mr-2 h-5 w-5 text-indigo-600" />
                        Progression du syllabus
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                    {syllabus_progress?.length > 0 ? (
                        <ul className="space-y-3">
                            {syllabus_progress.map((p, i) => (
                                <li key={i} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                                    <span className="text-sm text-slate-700">{p.module}</span>
                                    <span className="font-medium text-slate-800">{p.progress_percent}%</span>
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
                        <Award className="mr-2 h-5 w-5 text-indigo-600" />
                        Dernieres notes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                    {latest_grades?.length > 0 ? (
                        <ul className="space-y-2">
                            {latest_grades.slice(0, 5).map((g, i) => (
                                <li key={i} className="flex justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
                                    <span className="text-slate-700">{g.evaluation} ({g.module})</span>
                                    <span className="font-medium text-slate-900">{g.value}</span>
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
                        <li className="flex justify-between rounded-lg border border-slate-200 px-3 py-2"><span>Total</span><span className="font-medium">{attendance.monthly_summary.total_count}</span></li>
                        <li className="flex justify-between rounded-lg border border-slate-200 px-3 py-2"><span>Presents</span><span className="font-medium text-emerald-700">{attendance.monthly_summary.present_count}</span></li>
                        <li className="flex justify-between rounded-lg border border-slate-200 px-3 py-2"><span>Absents</span><span className="font-medium text-red-700">{attendance.monthly_summary.absent_count}</span></li>
                        <li className="flex justify-between rounded-lg border border-slate-200 px-3 py-2"><span>Retards</span><span className="font-medium text-amber-700">{attendance.monthly_summary.late_count}</span></li>
                        <li className="flex justify-between rounded-lg border border-slate-300 bg-slate-50 px-3 py-2"><span>Taux de presence</span><span className="font-semibold">{attendance.monthly_summary.attendance_rate_percent}%</span></li>
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
                                <li key={h.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                                    <div>
                                        <p className="font-medium text-slate-800">{h.module?.code} - {h.module?.label}</p>
                                        <p className="text-slate-500">{h.group?.label} - {h.date}</p>
                                    </div>
                                    <span className={h.status === 'absent' ? 'text-red-600 font-medium' : h.status === 'late' ? 'text-amber-600 font-medium' : 'text-emerald-700 font-medium'}>
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

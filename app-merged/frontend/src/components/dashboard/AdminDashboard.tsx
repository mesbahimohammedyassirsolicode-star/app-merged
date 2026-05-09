import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Users, GraduationCap, Briefcase, School, BookOpen, ClipboardList } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import type { AdminDashboardData } from '../../api/dashboardService';
import { analyticsApi } from '../../api/api/analytics';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { EmptyState } from '../ui/empty-state';

interface AdminDashboardProps {
    data: AdminDashboardData;
    userName: string;
}

export default function AdminDashboard({ data, userName }: AdminDashboardProps) {
    const navigate = useNavigate();
    const { stats, charts, attendance, quick_actions } = data;
    const [filters, setFilters] = useState<{ module_id?: number; group_id?: number; date_from?: string; date_to?: string }>({});
    const { data: analytics } = useQuery({
        queryKey: ['analytics', 'admin-overview', filters],
        queryFn: () => analyticsApi.overview(filters),
    });

    const statCards = [
        { title: 'Stagiaires', value: stats.total_students, icon: GraduationCap, color: 'text-blue-600', bg: 'bg-blue-100' },
        { title: 'Formateurs', value: stats.total_teachers, icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-100' },
        { title: 'Filieres', value: stats.total_filieres, icon: School, color: 'text-orange-600', bg: 'bg-orange-100' },
        { title: 'Groupes', value: stats.total_groupes, icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
        { title: 'Taux presence', value: `${analytics?.kpis.attendance_rate ?? 0}%`, icon: ClipboardList, color: 'text-cyan-600', bg: 'bg-cyan-100' },
        { title: 'Moyenne generale', value: `${analytics?.kpis.average_grade ?? 0}/20`, icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Tableau de bord - Administration</h1>
                <p className="mt-1 text-sm text-slate-600">Bienvenue, {userName}.</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Filtres analytiques</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Module ID" onChange={(e) => setFilters((prev) => ({ ...prev, module_id: e.target.value ? Number(e.target.value) : undefined }))} />
                        <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Group ID" onChange={(e) => setFilters((prev) => ({ ...prev, group_id: e.target.value ? Number(e.target.value) : undefined }))} />
                        <input type="date" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" onChange={(e) => setFilters((prev) => ({ ...prev, date_from: e.target.value || undefined }))} />
                        <input type="date" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" onChange={(e) => setFilters((prev) => ({ ...prev, date_to: e.target.value || undefined }))} />
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {statCards.map(({ title, value, icon: Icon, color, bg }) => (
                    <Card key={title} className="p-5">
                        <div className="flex items-center">
                            <div className={`mr-4 rounded-xl p-3 ${bg}`}>
                                <Icon className={`h-6 w-6 ${color}`} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">{title}</p>
                                <p className="text-2xl font-bold text-slate-900">{value}</p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Distribution des notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64">
                            {analytics?.charts.grade_distribution?.length ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={analytics.charts.grade_distribution}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis dataKey="bucket" tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <Tooltip />
                                        <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyState title="No data available" description="Aucune distribution de notes." />
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Stagiaires par filiere</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64">
                        {charts.students_per_filiere?.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={charts.students_per_filiere}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                                    <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <EmptyState title="No data available" description="Aucune donnee pour ce graphique." />
                        )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Absence par groupe/module</CardTitle>
                    </CardHeader>
                    <CardContent>
                    {attendance.absence_rate_by_group_module?.length > 0 ? (
                        <ul className="max-h-64 space-y-2 overflow-y-auto">
                            {attendance.absence_rate_by_group_module.map((row) => (
                                <li key={`${row.group_id}-${row.module_id}`} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm">
                                    <div>
                                        <p className="font-medium text-slate-800">{row.module_code} - {row.module_label}</p>
                                        <p className="text-slate-500">{row.group_label}</p>
                                    </div>
                                    <span className={row.is_risk ? 'font-semibold text-amber-600' : 'font-semibold text-slate-700'}>
                                        {row.absence_rate_percent}%
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <EmptyState title="No data available" description="Aucune donnee d'absence disponible." />
                    )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Resume mensuel (absence %)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64">
                        {attendance.monthly_summary?.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={attendance.monthly_summary}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} />
                                    <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                                    <Tooltip />
                                    <Bar dataKey="absence_rate_percent" fill="#f97316" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <EmptyState title="No data available" description="Aucune donnee de resume mensuel." />
                        )}
                    </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Progression moyenne</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64">
                            {analytics?.charts.progress_over_time?.length ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={analytics.charts.progress_over_time}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis dataKey="period" tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="avg_grade" stroke="#4f46e5" strokeWidth={2} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyState title="No data available" description="Aucune courbe de progression." />
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Raccourcis</CardTitle>
                    </CardHeader>
                    <CardContent>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {quick_actions.map(({ label, path }) => (
                            <Button
                                key={path}
                                variant="outline"
                                className="h-auto justify-start py-4"
                                onClick={() => navigate(path)}
                            >
                                <BookOpen className="mr-2 h-5 w-5 text-slate-600" />
                                {label}
                            </Button>
                        ))}
                        <Button variant="outline" className="h-auto justify-start py-4" onClick={() => navigate('/users')}>
                            <Users className="mr-2 h-5 w-5" />
                            Gerer les utilisateurs
                        </Button>
                        <Button variant="outline" className="h-auto justify-start py-4" onClick={() => navigate('/groups')}>
                            <ClipboardList className="mr-2 h-5 w-5" />
                            Groupes
                        </Button>
                    </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

import { useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { Users, GraduationCap, Briefcase, School, BookOpen, ClipboardList, FilterX, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { motion } from 'framer-motion';
import type { AdminDashboardData } from '../../api/dashboardService';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { EmptyState } from '../ui/empty-state';
import { StatCard } from './StatCard';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { groupsApi } from '../../api/api/groups';
import { academicStructureApi } from '../../api/api/academicStructure';
import { Loader2 } from 'lucide-react';
import { ChartSkeleton } from '../ui/loading-skeleton';
import { RecentAbsencesWidget } from './widgets/RecentAbsencesWidget';
import { AttendanceTrendWidget } from './widgets/AttendanceTrendWidget';
import { useAnalyticsOverview } from '../../features/analytics/hooks/useAnalyticsOverview';
import type { AnalyticsFiltersContract } from '../../features/analytics/contracts';
import PageHeader from '../layout/PageHeader';

interface AdminDashboardProps {
    data: AdminDashboardData;
    userName: string;
}

export default function AdminDashboard({ data, userName }: AdminDashboardProps) {
    const navigate = useNavigate();
    const { stats, charts, quick_actions } = data;
    const [filters, setFilters] = useState<AnalyticsFiltersContract>({});

    const { data: analytics, isLoading: isLoadingAnalytics } = useAnalyticsOverview('admin', filters);

    const { data: groupsData, isFetching: isFetchingGroups } = useQuery({
        queryKey: ['groups', 'list-simple', filters.filiere_id],
        queryFn: () => {
            console.log('[AdminDashboard] Fetching groups for filiere_id:', filters.filiere_id);
            return groupsApi.list({ filiere_id: filters.filiere_id, per_page: 100 });
        },
        enabled: !!filters.filiere_id,
        staleTime: 0,
        gcTime: 0,
    });

    const { data: filieresData, isLoading: isLoadingFilieres } = useQuery({
        queryKey: ['filieres', 'list-simple'],
        queryFn: () => academicStructureApi.listFilieres(),
    });

    const filteredGroups = useMemo(() => {
        if (!filters.filiere_id) {
            console.log('[AdminDashboard] No filiere_id selected, returning empty groups array');
            return [];
        }
        const groups = groupsData?.items ?? [];
        console.log(`[AdminDashboard] Returning ${groups.length} groups for filiere_id ${filters.filiere_id}`);
        return groups;
    }, [groupsData?.items, filters.filiere_id]);

    const filteredStudentsPerFiliere = useMemo(() => {
        if (!filters.filiere_id) {
            return charts.students_per_filiere ?? [];
        }

        const selectedFiliere = filieresData?.find((filiere) => filiere.id === filters.filiere_id);
        if (!selectedFiliere) {
            return charts.students_per_filiere ?? [];
        }

        return (charts.students_per_filiere ?? []).filter((entry) => {
            const name = entry.name.toLowerCase();
            return (
                name === selectedFiliere.label.toLowerCase() ||
                name.includes(selectedFiliere.label.toLowerCase()) ||
                name.includes(selectedFiliere.code.toLowerCase())
            );
        });
    }, [charts.students_per_filiere, filieresData, filters.filiere_id]);

    const handleFiliereChange = (value: string) => {
        const filiereId = value ? Number(value) : undefined;
        console.log('[AdminDashboard] Filière selection changed to:', filiereId);
        setFilters((prev) => ({
            ...prev,
            filiere_id: filiereId,
            group_id: undefined,
        }));
    };

    const statCards = [
        { title: 'Stagiaires', value: analytics?.kpis.total_students ?? stats.total_students, icon: <GraduationCap className="h-6 w-6" />, colorTheme: 'blue' as const },
        { title: 'Formateurs', value: analytics?.kpis.total_teachers ?? stats.total_teachers, icon: <Briefcase className="h-6 w-6" />, colorTheme: 'emerald' as const },
        { title: 'Filières', value: analytics?.kpis.total_filieres ?? stats.total_filieres, icon: <School className="h-6 w-6" />, colorTheme: 'orange' as const },
        { title: 'Groupes', value: analytics?.kpis.total_groupes ?? stats.total_groupes, icon: <Users className="h-6 w-6" />, colorTheme: 'purple' as const },
        { title: 'Taux présence', value: `${analytics?.kpis.attendance_rate ?? 0}%`, icon: <ClipboardList className="h-6 w-6" />, colorTheme: 'cyan' as const },
        { title: 'Moyenne générale', value: `${analytics?.kpis.average_grade ?? 0}/20`, icon: <BookOpen className="h-6 w-6" />, colorTheme: 'indigo' as const },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Tableau de bord - Administration"
                subtitle={`Bienvenue, ${userName}. Voici un aperçu de votre établissement.`}
            />

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
            >
                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <CardTitle>Filtres analytiques</CardTitle>
                            {Object.keys(filters).length > 0 && (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setFilters({})}
                                    className="inline-flex items-center gap-2 rounded-lg text-sm text-theme-text-secondary transition-colors hover:text-blue-400"
                                >
                                    <FilterX className="h-4 w-4" />
                                    Effacer
                                </motion.button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="space-y-2">
                                <Label htmlFor="filiere_id" className="text-theme-text-secondary">Filière</Label>
                                <div className="relative">
                                    <select
                                        id="filiere_id"
                                        value={filters.filiere_id || ''}
                                        onChange={(e) => handleFiliereChange(e.target.value)}
                                        className="app-control w-full"
                                        disabled={isLoadingFilieres}
                                    >
                                        <option value="" className="bg-theme-surface text-theme-text-primary">Toutes les filières</option>
                                        {filieresData?.map((filiere) => (
                                            <option key={filiere.id} value={filiere.id} className="bg-theme-surface text-theme-text-primary">
                                                {filiere.code} - {filiere.label}
                                            </option>
                                        ))}
                                    </select>
                                    {isLoadingFilieres && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-blue-400" />}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="group_id" className="text-theme-text-secondary">Groupe</Label>
                                <div className="relative">
                                    <select
                                        id="group_id"
                                        value={filters.group_id || ''}
                                        onChange={(e) => {
                                            const val = e.target.value ? Number(e.target.value) : undefined;
                                            console.log('[AdminDashboard] Group selection changed to:', val);
                                            setFilters((prev) => ({ ...prev, group_id: val }));
                                        }}
                                        className={`app-control w-full transition-all duration-200 ${
                                            isFetchingGroups ? 'animate-pulse opacity-70 border-blue-500/50' : ''
                                        }`}
                                        disabled={!filters.filiere_id || isFetchingGroups}
                                    >
                                        {!filters.filiere_id ? (
                                            <option value="" className="bg-theme-surface text-theme-text-secondary">
                                                Sélectionnez d'abord une filière
                                            </option>
                                        ) : isFetchingGroups ? (
                                            <option value="" className="bg-theme-surface text-theme-text-secondary">
                                                Chargement des groupes...
                                            </option>
                                        ) : (
                                            <>
                                                <option value="" className="bg-theme-surface text-theme-text-primary">Tous les groupes</option>
                                                {filteredGroups.map((g) => (
                                                    <option key={g.id} value={g.id} className="bg-theme-surface text-theme-text-primary">
                                                        {g.label}
                                                    </option>
                                                ))}
                                                {filteredGroups.length === 0 && (
                                                    <option value="" disabled className="bg-theme-surface text-theme-text-secondary">
                                                        Aucun groupe trouvé
                                                    </option>
                                                )}
                                            </>
                                        )}
                                    </select>
                                    {filters.filiere_id && isFetchingGroups && (
                                        <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-blue-400" />
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="date_from" className="text-theme-text-secondary">Date de début</Label>
                                <Input
                                    id="date_from"
                                    type="date"
                                    value={filters.date_from || ''}
                                    onChange={(e) => setFilters((prev) => ({ ...prev, date_from: e.target.value || undefined }))}
                                    className="app-control"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="date_to" className="text-theme-text-secondary">Date de fin</Label>
                                <Input
                                    id="date_to"
                                    type="date"
                                    value={filters.date_to || ''}
                                    onChange={(e) => setFilters((prev) => ({ ...prev, date_to: e.target.value || undefined }))}
                                    className="app-control"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
                {statCards.map((card, idx) => (
                    <StatCard
                        key={card.title}
                        title={card.title}
                        value={card.value}
                        icon={card.icon}
                        colorTheme={card.colorTheme}
                        delay={idx * 0.05}
                    />
                ))}
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="grid grid-cols-1 gap-6 lg:grid-cols-2"
            >
                <Card>
                    <CardHeader>
                        <CardTitle>Distribution des notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64">
                            {isLoadingAnalytics ? (
                                <ChartSkeleton />
                            ) : analytics?.charts.grade_distribution?.length ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={analytics.charts.grade_distribution}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgb(var(--theme-border) / 0.65)" />
                                        <XAxis dataKey="bucket" tick={{ fill: 'rgb(var(--theme-text-secondary))', fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: 'rgb(var(--theme-text-secondary))', fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(59,130,246,0.1)' }}
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: '1px solid rgba(148,163,184,0.2)',
                                                backgroundColor: 'rgb(var(--theme-surface))',
                                                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                                            }}
                                            labelStyle={{ color: 'rgb(var(--theme-border))' }}
                                        />
                                        <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyState title="Aucune donnée" description="Aucune distribution de notes." />
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Stagiaires par filière</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64">
                            {filteredStudentsPerFiliere.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={filteredStudentsPerFiliere}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgb(var(--theme-border) / 0.65)" />
                                        <XAxis dataKey="name" tick={{ fill: 'rgb(var(--theme-text-secondary))', fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: 'rgb(var(--theme-text-secondary))', fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(99,102,241,0.1)' }}
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: '1px solid rgba(148,163,184,0.2)',
                                                backgroundColor: 'rgb(var(--theme-surface))',
                                                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                                            }}
                                            labelStyle={{ color: 'rgb(var(--theme-border))' }}
                                        />
                                        <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyState title="Aucune donnée" description="Aucune donnée pour ce graphique." />
                            )}
                        </div>
                    </CardContent>
                </Card>

                <RecentAbsencesWidget />
                <AttendanceTrendWidget />
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="grid grid-cols-1 gap-6 lg:grid-cols-2"
            >
                <Card>
                    <CardHeader>
                        <CardTitle>Progression moyenne</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64">
                            {isLoadingAnalytics ? (
                                <ChartSkeleton />
                            ) : analytics?.charts.progress_over_time?.length ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={analytics.charts.progress_over_time}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgb(var(--theme-border) / 0.65)" />
                                        <XAxis dataKey="period" tick={{ fill: 'rgb(var(--theme-text-secondary))', fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: 'rgb(var(--theme-text-secondary))', fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: '1px solid rgba(148,163,184,0.2)',
                                                backgroundColor: 'rgb(var(--theme-surface))',
                                                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                                            }}
                                            labelStyle={{ color: 'rgb(var(--theme-border))' }}
                                        />
                                        <Line type="monotone" dataKey="avg_grade" stroke="#6366f1" strokeWidth={3} dot={{ r: 5, fill: '#6366f1' }} activeDot={{ r: 7 }} isAnimationActive />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyState title="Aucune donnée" description="Aucune courbe de progression." />
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Raccourcis rapides</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {quick_actions.map(({ label, path }) => (
                                <motion.button
                                    key={path}
                                    whileHover={{ x: 4 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => navigate(path)}
                                    className="group flex items-center justify-between rounded-[12px] border border-theme-border glass-panel/[0.03] px-4 py-3 text-theme-text-secondary transition-all hover:border-blue-500/30 hover:glass-panel/[0.08]"
                                >
                                    <span className="flex items-center gap-3">
                                        <BookOpen className="h-5 w-5 text-blue-400 transition-transform group-hover:scale-110" />
                                        <span className="text-sm font-medium">{label}</span>
                                    </span>
                                    <ChevronRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                                </motion.button>
                            ))}
                            <motion.button
                                whileHover={{ x: 4 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate('/users')}
                                className="group flex items-center justify-between rounded-[12px] border border-theme-border glass-panel/[0.03] px-4 py-3 text-theme-text-secondary transition-all hover:border-emerald-500/30 hover:glass-panel/[0.08]"
                            >
                                <span className="flex items-center gap-3">
                                    <Users className="h-5 w-5 text-emerald-400 transition-transform group-hover:scale-110" />
                                    <span className="text-sm font-medium">Gérer les utilisateurs</span>
                                </span>
                                <ChevronRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                            </motion.button>
                            <motion.button
                                whileHover={{ x: 4 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate('/groups')}
                                className="group flex items-center justify-between rounded-[12px] border border-theme-border glass-panel/[0.03] px-4 py-3 text-theme-text-secondary transition-all hover:border-purple-500/30 hover:glass-panel/[0.08]"
                            >
                                <span className="flex items-center gap-3">
                                    <ClipboardList className="h-5 w-5 text-purple-400 transition-transform group-hover:scale-110" />
                                    <span className="text-sm font-medium">Groupes</span>
                                </span>
                                <ChevronRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                            </motion.button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}

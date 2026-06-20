import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  TrendingUp, 
  Layers, 
  AlertTriangle, 
  User, 
  GraduationCap, 
  AlertCircle, 
  UserPlus,
  ArrowUpRight,
  Filter,
  Download,
  Loader2
} from 'lucide-react';
import StatsCard from '../components/dashboard/StatsCard';
import AttendanceChart from '../components/dashboard/AttendanceChart';
import LevelDonutChart from '../components/dashboard/LevelDonutChart';
import AlertsTable from '../components/dashboard/AlertsTable';
import QuickActions from '../components/dashboard/QuickActions';
import dashboardService from '../services/dashboardService';
import { mockDashboardStats } from '../data/mockDashboard';

export default function Dashboard() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardService.getStats,
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Log error for debugging but don't crash the UI
  if (error) {
    console.error("Dashboard API Error:", error);
  }

  if (isLoading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Chargement des données...</p>
        </div>
      </div>
    );
  }

  // Use real data if available, otherwise fallback to mock data
  const displayStats = stats || mockDashboardStats;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {error && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-3 text-amber-500 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>Note: Affichage des données hors-ligne (L'API a retourné une erreur).</p>
        </div>
      )}
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Command Center</h1>
          <p className="text-muted-foreground mt-1">Bienvenue sur votre tableau de bord EduFlow.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card hover:bg-accent transition-colors text-sm font-medium">
            <Filter className="w-4 h-4" />
            Filtrer par année
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity text-sm font-medium shadow-lg shadow-primary/20">
            <Download className="w-4 h-4" />
            Exporter PDF
          </button>
        </div>
      </div>

      {/* Stats Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatsCard 
          title="Total Élèves" 
          value={displayStats?.totalEleves || "0"} 
          icon={Users} 
          trend={displayStats?.elevesTrend?.type} 
          trendValue={displayStats?.elevesTrend?.value} 
          color="bg-blue-500/10 text-blue-500"
        />
        <StatsCard 
          title="Présence aujourd'hui" 
          value={`${displayStats?.presenceToday || "0"}%`} 
          icon={TrendingUp} 
          trend={displayStats?.presenceTrend?.type} 
          trendValue={displayStats?.presenceTrend?.value} 
          color="bg-emerald-500/10 text-emerald-500"
        />
        <StatsCard 
          title="Revenus du mois" 
          value={`${displayStats?.revenusMois || "0"} DH`} 
          icon={Layers} 
          trend={displayStats?.revenusTrend?.type} 
          trendValue={displayStats?.revenusTrend?.value} 
          color="bg-purple-500/10 text-purple-500"
        />
        <StatsCard 
          title="Alertes" 
          value={displayStats?.totalAlertes || "0"} 
          icon={AlertTriangle} 
          trend={displayStats?.alertesTrend?.type} 
          trendValue={displayStats?.alertesTrend?.value} 
          color="bg-rose-500/10 text-rose-500"
        />
      </div>

      {/* Stats Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatsCard 
          title="Total Enseignants" 
          value={displayStats?.totalEnseignants || "0"} 
          icon={User} 
          color="bg-amber-500/10 text-amber-500"
        />
        <StatsCard 
          title="Classes actives" 
          value={displayStats?.totalClasses || "0"} 
          icon={GraduationCap} 
          color="bg-sky-500/10 text-sky-500"
        />
        <StatsCard 
          title="Impayés" 
          value={displayStats?.totalImpayes || "0"} 
          icon={AlertCircle} 
          color="bg-rose-500/10 text-rose-500"
        />
        <StatsCard 
          title="Nouveaux inscrits" 
          value={displayStats?.nouveauxInscrits || "0"} 
          icon={UserPlus} 
          color="bg-indigo-500/10 text-indigo-500"
        />
      </div>

      {/* Charts & Actions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        {/* Left column - Charts & Table */}
        <div className="lg:col-span-8 space-y-6 md:space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Line Chart */}
            <div className="glass border border-border/50 rounded-[2rem] p-6 shadow-sm overflow-hidden group hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg">Tendance de présence</h3>
                <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-lg">30 derniers jours</span>
              </div>
              <AttendanceChart />
            </div>

            {/* Donut Chart */}
            <div className="glass border border-border/50 rounded-[2rem] p-6 shadow-sm overflow-hidden group hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg">Élèves par niveau</h3>
                <button className="text-primary hover:underline text-xs flex items-center gap-1 font-medium">
                  Détails <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
              <LevelDonutChart />
            </div>
          </div>

          {/* Latest Alerts Table */}
          <div className="glass border border-border/50 rounded-[2rem] p-6 shadow-sm overflow-hidden group hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg">Dernières alertes</h3>
              <button className="px-3 py-1.5 rounded-xl bg-muted/50 hover:bg-accent transition-colors text-xs font-semibold">
                Voir tout
              </button>
            </div>
            <AlertsTable />
          </div>
        </div>

        {/* Right column - Quick Actions */}
        <div className="lg:col-span-4 space-y-6">
          <div className="sticky top-24">
            <h3 className="font-bold text-lg mb-4 px-2">Actions Rapides</h3>
            <QuickActions />
          </div>
        </div>
      </div>
    </div>
  );
}

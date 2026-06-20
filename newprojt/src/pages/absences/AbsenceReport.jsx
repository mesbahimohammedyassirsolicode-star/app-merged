import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import { 
  Download, 
  TrendingUp, 
  Users, 
  FileBarChart
} from 'lucide-react';

const classData = [
  { name: '2ème BAC SM-A', count: 18 },
  { name: '1ère BAC SE', count: 25 },
  { name: '3ème Année Collège', count: 12 },
  { name: '6ème Année', count: 8 },
  { name: '5ème Année', count: 15 },
  { name: '2ème Année Collège', count: 22 },
];

const trendData = [
  { date: '04-12', total: 10, justified: 6 },
  { date: '04-19', total: 15, justified: 8 },
  { date: '04-26', total: 12, justified: 10 },
  { date: '05-03', total: 20, justified: 12 },
  { date: '05-10', total: 14, justified: 11 },
  { date: '05-11', total: 12, justified: 4 },
];

export default function AbsenceReport({ onBack: _onBack }) {
  
  const handleExport = () => {
    // Mock export toast
    alert('Exportation du rapport en format PDF... Succès !');
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500 pb-12">
      {/* Header with Export */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
            <FileBarChart className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Rapports & Analyses</h2>
            <p className="text-sm text-muted-foreground">Statistiques détaillées sur l'absentéisme.</p>
          </div>
        </div>
        
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 bg-accent text-accent-foreground px-6 py-3 rounded-2xl font-semibold hover:bg-accent/80 transition-all border border-border shadow-sm group"
        >
          <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
          Exporter (PDF)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bar Chart: Absences par classe */}
        <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-lg">Absences par classe</h3>
            </div>
            <span className="text-xs font-medium text-muted-foreground bg-accent px-3 py-1 rounded-full uppercase tracking-wider">Ce mois</span>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#888', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#888', fontSize: 12 }} 
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(var(--primary), 0.05)' }}
                  contentStyle={{ 
                    backgroundColor: '#1a1a1a', 
                    border: '1px solid #333', 
                    borderRadius: '16px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar 
                  dataKey="count" 
                  fill="hsl(var(--primary))" 
                  radius={[8, 8, 0, 0]} 
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Line Chart: Évolution 30 jours */}
        <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-lg">Évolution des absences</h3>
            </div>
            <span className="text-xs font-medium text-muted-foreground bg-accent px-3 py-1 rounded-full uppercase tracking-wider">30 Jours</span>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#888', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#888', fontSize: 12 }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1a1a1a', 
                    border: '1px solid #333', 
                    borderRadius: '16px' 
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  name="Total"
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorTotal)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="justified" 
                  name="Justifiées"
                  stroke="#10b981" 
                  strokeWidth={3}
                  fill="transparent"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Summary Footer Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-primary/5 border border-primary/20 p-6 rounded-3xl">
          <p className="text-sm font-medium text-primary uppercase tracking-wider mb-1">Total ce mois</p>
          <p className="text-3xl font-bold">148</p>
          <div className="mt-2 flex items-center gap-1 text-xs text-red-500 font-medium">
            <TrendingUp className="w-3 h-3 rotate-45" />
            +12% par rapport au mois dernier
          </div>
        </div>
        <div className="bg-emerald-500/5 border border-emerald-500/20 p-6 rounded-3xl">
          <p className="text-sm font-medium text-emerald-500 uppercase tracking-wider mb-1">Taux de justification</p>
          <p className="text-3xl font-bold">76%</p>
          <div className="mt-2 flex items-center gap-1 text-xs text-emerald-500 font-medium">
            <TrendingUp className="w-3 h-3" />
            +5% d'amélioration
          </div>
        </div>
        <div className="bg-accent/50 border border-border p-6 rounded-3xl">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Classe la plus absente</p>
          <p className="text-2xl font-bold">1ère BAC SE</p>
          <p className="mt-2 text-xs text-muted-foreground font-medium">25 absences cumulées</p>
        </div>
      </div>
    </div>
  );
}

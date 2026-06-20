import { useState } from 'react';
import { 
  Search, 
  Download, 
  Plus, 
  FileText, 
  Edit2, 
  TrendingUp,
  Users,
  Wallet
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { mockPayments } from '../../data/mockFinance';
import PaymentForm from './PaymentForm';

export default function Payments() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Stats calculation (mock)
  const stats = [
    { label: 'Total encaissé ce mois', value: '142,500 DH', icon: Wallet, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Nombre de paiements', value: '154', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Taux de recouvrement', value: '85%', icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Payé': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'Partiel': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'En attente': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const filteredPayments = mockPayments.filter(payment => {
    const matchesSearch = payment.student.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestion des Paiements</h1>
          <p className="text-muted-foreground">Suivi des encaissements et reçus scolaires.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border hover:bg-accent transition-colors text-sm font-medium">
            <Download className="w-4 h-4" />
            Exporter
          </button>
          <button 
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity text-sm font-medium shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            Enregistrer un paiement
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="p-6 rounded-[2rem] bg-card border border-border/50 shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-3 rounded-2xl transition-transform group-hover:scale-110 duration-300", stat.bg)}>
                <stat.icon className={cn("w-6 h-6", stat.color)} />
              </div>
              <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">+12%</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium mb-1">{stat.label}</p>
              <h3 className="text-2xl font-bold">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Filters & Table */}
      <div className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Rechercher un élève..." 
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <select 
                className="px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Tous les statuts</option>
                <option value="Payé">Payé</option>
                <option value="Partiel">Partiel</option>
                <option value="En attente">En attente</option>
              </select>
              <select className="px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option>Mai 2026</option>
                <option>Avril 2026</option>
                <option>Mars 2026</option>
              </select>
              <select className="px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option>Toutes les classes</option>
                <option>2ème BAC SM-A</option>
                <option>1ère BAC SE-B</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/30">
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Élève</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Classe</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mois</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Montant</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mode</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Statut</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredPayments.length > 0 ? filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-muted/20 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs">
                        {payment.student.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="font-medium text-sm">{payment.student}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{payment.class}</td>
                  <td className="px-6 py-4 text-sm font-medium">{payment.month}</td>
                  <td className="px-6 py-4 text-sm font-bold">{payment.amount} DH</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{payment.date}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs px-2 py-1 rounded-lg bg-background border border-border">
                      {payment.method}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full border",
                      getStatusColor(payment.status)
                    )}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors" title="Télécharger Reçu">
                        <FileText className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-blue-500/10 hover:text-blue-500 transition-colors" title="Modifier">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="8" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4 opacity-50">
                      <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
                        <Wallet className="w-10 h-10" />
                      </div>
                      <p className="text-xl font-medium">Aucun paiement disponible</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isFormOpen && <PaymentForm onClose={() => setIsFormOpen(false)} />}
    </div>
  );
}

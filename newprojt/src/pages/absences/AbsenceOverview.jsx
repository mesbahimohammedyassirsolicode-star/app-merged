import { useState } from 'react';
import { 
  Search, 
  Plus, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  FileText,
  UserCheck,
  UserX,
  TrendingDown
} from 'lucide-react';
import { cn } from '../../lib/utils';

const mockAbsences = [
  { id: 1, student: "Yassine El Amrani", class: "2ème BAC SM-A", level: "Lycée", date: "2026-05-11", session: "Matin", reason: "Maladie", status: "Justifiée" },
  { id: 2, student: "Fatima-Zahra Alaoui", class: "1ère BAC SE", level: "Lycée", date: "2026-05-11", session: "Après-midi", reason: "Familial", status: "Non justifiée" },
  { id: 3, student: "Mehdi Benjelloun", class: "3ème Année Collège", level: "Collège", date: "2026-05-11", session: "Matin", reason: "Inconnu", status: "En attente" },
  { id: 4, student: "Leila Haddad", class: "6ème Année", level: "Primaire", date: "2026-05-10", session: "Journée", reason: "Maladie", status: "Justifiée" },
  { id: 5, student: "Omar Mansouri", class: "2ème BAC SM-A", level: "Lycée", date: "2026-05-10", session: "Matin", reason: "Autre", status: "Non justifiée" },
  { id: 6, student: "Salma Tazi", class: "1ère BAC SE", level: "Lycée", date: "2026-05-10", session: "Après-midi", reason: "Inconnu", status: "En attente" },
  { id: 7, student: "Amine Chraibi", class: "3ème Année Collège", level: "Collège", date: "2026-05-09", session: "Matin", reason: "Familial", status: "Justifiée" },
  { id: 8, student: "Kenza Belkhayat", class: "6ème Année", level: "Primaire", date: "2026-05-09", session: "Journée", reason: "Maladie", status: "Justifiée" },
  { id: 9, student: "Driss Filali", class: "2ème BAC SM-A", level: "Lycée", date: "2026-05-08", session: "Matin", reason: "Inconnu", status: "Non justifiée" },
  { id: 10, student: "Meriem Bennani", class: "1ère BAC SE", level: "Lycée", date: "2026-05-08", session: "Après-midi", reason: "Familial", status: "Justifiée" },
  { id: 11, student: "Khalid Idrissi", class: "3ème Année Collège", level: "Collège", date: "2026-05-07", session: "Matin", reason: "Autre", status: "En attente" },
  { id: 12, student: "Sofia Kabbaj", class: "6ème Année", level: "Primaire", date: "2026-05-07", session: "Journée", reason: "Maladie", status: "Justifiée" },
  { id: 13, student: "Youssef Tahiri", class: "2ème BAC SM-A", level: "Lycée", date: "2026-05-06", session: "Matin", reason: "Inconnu", status: "Non justifiée" },
  { id: 14, student: "Nadia Sabri", class: "1ère BAC SE", level: "Lycée", date: "2026-05-06", session: "Après-midi", reason: "Familial", status: "Justifiée" },
  { id: 15, student: "Rachid El Fassi", class: "3ème Année Collège", level: "Collège", date: "2026-05-05", session: "Matin", reason: "Autre", status: "Non justifiée" },
];

export default function AbsenceOverview({ onAdd }) {
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const stats = [
    { label: "Total absences aujourd'hui", value: "12", icon: UserX, color: "text-red-500", bg: "bg-red-500/10" },
    { label: "Taux d'absence %", value: "4.2%", icon: TrendingDown, color: "text-orange-500", bg: "bg-orange-500/10" },
    { label: "Absences non justifiées", value: "8", icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-500/10" },
    { label: "Absences justifiées", value: "4", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  ];

  const filteredAbsences = mockAbsences.filter(abs => {
    const matchesSearch = abs.student.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'All' || abs.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-card border border-border p-6 rounded-2xl flex items-center gap-4 group hover:border-primary/50 transition-all shadow-sm">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", stat.bg)}>
              <stat.icon className={cn("w-6 h-6", stat.color)} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-bold mt-0.5">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters & Actions */}
      <div className="bg-card border border-border p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Rechercher un élève..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-accent/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
            />
          </div>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-accent/50 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          >
            <option value="All">Tous les statuts</option>
            <option value="Justifiée">Justifiée</option>
            <option value="Non justifiée">Non justifiée</option>
            <option value="En attente">En attente</option>
          </select>
        </div>
        
        <button 
          onClick={onAdd}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20 whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          Enregistrer une absence
        </button>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-accent/30">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Élève</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Classe / Niveau</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Date</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Séance</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Motif</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Statut</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredAbsences.length > 0 ? filteredAbsences.map((abs) => (
                <tr key={abs.id} className="hover:bg-accent/20 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs uppercase">
                        {abs.student.charAt(0)}
                      </div>
                      <span className="font-medium text-sm">{abs.student}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex flex-col">
                      <span>{abs.class}</span>
                      <span className="text-xs text-muted-foreground">{abs.level}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {abs.date}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {abs.session}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm italic text-muted-foreground">{abs.reason}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                      abs.status === 'Justifiée' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                      abs.status === 'Non justifiée' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                      "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                    )}>
                      {abs.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 hover:bg-accent rounded-lg transition-colors text-muted-foreground hover:text-primary" title="Justifier">
                        <FileText className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-accent rounded-lg transition-colors text-muted-foreground hover:text-foreground" title="Voir fiche">
                        <UserCheck className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="7" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4 opacity-50">
                      <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-10 h-10" />
                      </div>
                      <p className="text-xl font-medium">Aucune absence enregistrée</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

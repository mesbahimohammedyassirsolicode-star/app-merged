import { useState } from 'react';
import { 
  Search, 
  MessageSquare, 
  CheckCircle, 
  Filter, 
  Clock, 
  Phone,
  Send
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { mockUnpaid } from '../../data/mockFinance';

export default function Unpaid() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showToast, setShowToast] = useState(false);

  const handleRelancer = (_student) => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const getDelayColor = (days) => {
    if (days > 30) return 'bg-red-500/10 text-red-500 border-red-500/20';
    if (days > 15) return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
    return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Impayés & Retards</h1>
          <p className="text-muted-foreground">Gestion des créances et relances parents.</p>
        </div>
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
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-background border border-border hover:bg-accent transition-colors text-sm font-medium">
                <Filter className="w-4 h-4" />
                Filtres
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/30">
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Élève</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Classe</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mois impayé</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Montant dû</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Retard</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Téléphone</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {mockUnpaid.map((item) => (
                <tr key={item.id} className="hover:bg-muted/20 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 font-medium text-xs">
                        {item.student.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="font-medium text-sm">{item.student}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{item.class}</td>
                  <td className="px-6 py-4 text-sm font-medium">{item.unpaidMonth}</td>
                  <td className="px-6 py-4 text-sm font-bold text-red-500">{item.amountDue} DH</td>
                  <td className="px-6 py-4">
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider",
                      getDelayColor(item.delayDays)
                    )}>
                      <Clock className="w-3 h-3" />
                      {item.delayDays} jours
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-3 h-3" />
                      {item.parentPhone}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleRelancer(item.student)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500 text-white hover:opacity-90 transition-opacity text-xs font-semibold shadow-sm"
                      >
                        <MessageSquare className="w-3 h-3" />
                        Relancer
                      </button>
                      <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border hover:bg-accent transition-colors text-xs font-semibold">
                        <CheckCircle className="w-3 h-3" />
                        Marquer payé
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Success Toast */}
      {showToast && (
        <div className="fixed bottom-8 right-8 z-[200] animate-in slide-in-from-right-10 duration-300">
          <div className="bg-emerald-500 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-emerald-500/20 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold">Notification envoyée !</p>
              <p className="text-white/80 text-sm">Le rappel WhatsApp a été envoyé au parent.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

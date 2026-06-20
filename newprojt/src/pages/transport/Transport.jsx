import { useState } from 'react';
import { 
  Bus, 
  Users, 
  UserSquare2, 
  AlertTriangle, 
  Search, 
  Plus, 
  Clock, 
  MoreVertical,
  Navigation,
  XCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { 
  mockTransportStats, 
  mockTransportStudents, 
  mockBuses, 
  mockTransportIncidents 
} from '../../data/mockTransport';

export default function Transport() {
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [showBusForm, setShowBusForm] = useState(false);
  const [, setShowIncidentForm] = useState(false);

  const getStatusBadge = (statut) => {
    switch (statut) {
      case 'Actif':
      case 'En service':
      case 'Résolu':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'Suspendu':
      case 'Maintenance':
      case 'Ouvert':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getIcon = (iconName) => {
    switch (iconName) {
      case 'Users': return <Users className="w-5 h-5" />;
      case 'Bus': return <Bus className="w-5 h-5" />;
      case 'UserSquare2': return <UserSquare2 className="w-5 h-5" />;
      case 'AlertTriangle': return <AlertTriangle className="w-5 h-5" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transport Scolaire</h1>
          <p className="text-muted-foreground mt-1">Gestion de la flotte, des itinéraires et du suivi des élèves.</p>
        </div>
        <div className="flex items-center gap-3">
          {activeSubTab === 'buses' && (
            <button 
              onClick={() => setShowBusForm(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
            >
              <Plus className="w-4 h-4" />
              Ajouter un bus
            </button>
          )}
          {activeSubTab === 'incidents' && (
            <button 
              onClick={() => setShowIncidentForm(true)}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-xl font-medium hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-destructive/20"
            >
              <AlertTriangle className="w-4 h-4" />
              Signaler un incident
            </button>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {mockTransportStats.map((stat, i) => (
          <div key={i} className="bg-card border border-border p-6 rounded-[2rem] shadow-sm flex items-center gap-4 group hover:border-primary/30 transition-all">
            <div className={cn("w-12 h-12 rounded-2xl bg-muted flex items-center justify-center transition-transform group-hover:scale-110", stat.color)}>
              {getIcon(stat.icon)}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Sub-Tabs */}
      <div className="flex p-1 bg-card border border-border rounded-2xl w-fit overflow-x-auto max-w-full">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap",
            activeSubTab === 'overview' 
              ? "bg-background text-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Users className="w-4 h-4" />
          Vue Générale
        </button>
        <button
          onClick={() => setActiveSubTab('buses')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap",
            activeSubTab === 'buses' 
              ? "bg-background text-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Bus className="w-4 h-4" />
          Gestion des Bus
        </button>
        <button
          onClick={() => setActiveSubTab('tracking')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap",
            activeSubTab === 'tracking' 
              ? "bg-background text-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Navigation className="w-4 h-4" />
          Suivi Temps Réel
        </button>
        <button
          onClick={() => setActiveSubTab('incidents')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap",
            activeSubTab === 'incidents' 
              ? "bg-background text-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <AlertTriangle className="w-4 h-4" />
          Incidents
        </button>
      </div>

      {/* Content Areas */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="bg-card border border-border rounded-[2rem] p-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Rechercher un élève..."
                  className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <select className="bg-background border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm flex-1 md:flex-none">
                  <option>Toutes les Zones</option>
                  <option>Hay Salam</option>
                  <option>Mesnana</option>
                  <option>Beni Makada</option>
                  <option>Malabata</option>
                </select>
                <select className="bg-background border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm flex-1 md:flex-none">
                  <option>Tous les Bus</option>
                  <option>Bus #01</option>
                  <option>Bus #02</option>
                  <option>Bus #03</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Élève</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Zone</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bus Assigné</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Arrêts (M/S)</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {mockTransportStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {student.nom[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{student.nom}</p>
                            <p className="text-xs text-muted-foreground">{student.classe}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{student.zone}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">{student.bus}</span>
                          <span className="text-xs text-muted-foreground">{student.chauffeur}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-xs font-medium">
                          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded">{student.matin}</span>
                          <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-500 rounded">{student.soir}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold border", getStatusBadge(student.statut))}>
                          {student.statut}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button className="p-2 rounded-lg hover:bg-accent text-muted-foreground transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'buses' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bus</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Chauffeur</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Capacité</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Zone</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {mockBuses.map((bus) => (
                    <tr key={bus.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                            <Bus className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold">{bus.numero}</p>
                            <p className="text-xs text-muted-foreground">{bus.plaque}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{bus.chauffeur}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span>{bus.assignes} / {bus.capacite}</span>
                            <span>{Math.round((bus.assignes/bus.capacite)*100)}%</span>
                          </div>
                          <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={cn("h-full rounded-full transition-all duration-1000", (bus.assignes/bus.capacite) > 0.9 ? "bg-amber-500" : "bg-primary")} 
                              style={{ width: `${(bus.assignes/bus.capacite)*100}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{bus.zone}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold border", getStatusBadge(bus.statut))}>
                          {bus.statut}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button className="p-2 rounded-lg hover:bg-accent text-muted-foreground transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'tracking' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="relative bg-[#1e1e1e] border border-border rounded-[2rem] h-[400px] overflow-hidden group shadow-2xl">
            {/* Map Placeholder Grid */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
            
            {/* Animated Bus Icon */}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 animate-[bus-move_15s_linear_infinite]">
              <div className="relative">
                <div className="absolute -inset-4 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
                <div className="relative bg-primary p-3 rounded-2xl shadow-xl shadow-primary/40">
                  <Bus className="w-6 h-6 text-primary-foreground" />
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-popover border border-border px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shadow-xl">
                    Bus #04 — Hay Salam
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute top-6 left-6 flex flex-col gap-2">
              <div className="bg-background/80 backdrop-blur-md border border-border p-4 rounded-2xl shadow-xl">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-xs font-bold uppercase tracking-wider">Système Live</span>
                </div>
                <p className="text-sm text-muted-foreground">8 Bus en circulation</p>
              </div>
            </div>

            <div className="absolute bottom-6 right-6">
              <div className="bg-blue-600 px-4 py-2 rounded-xl text-white text-xs font-bold shadow-xl flex items-center gap-2">
                <Navigation className="w-3 h-3" />
                Intégration GPS à connecter ultérieurement
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {mockBuses.filter(b => b.statut === 'En service').map((bus) => (
              <div key={bus.id} className="bg-card border border-border p-5 rounded-[2rem] shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Bus className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{bus.numero}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Mis à jour il y a 2m</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    <span className="text-[10px] font-black text-emerald-500 uppercase">Actif</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium">{bus.zone}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'incidents' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bus / Chauffeur</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type d'incident</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Impact</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {mockTransportIncidents.map((incident) => (
                    <tr key={incident.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{incident.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">{incident.bus}</span>
                          <span className="text-xs text-muted-foreground">{incident.chauffeur}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-destructive"></div>
                          <span className="text-sm font-medium">{incident.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{incident.eleves}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold border", getStatusBadge(incident.statut))}>
                          {incident.statut}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button className="px-3 py-1.5 bg-accent text-accent-foreground rounded-lg text-xs font-bold hover:opacity-80 transition-all">
                          Détails
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Bus Form Modal Placeholder */}
      {showBusForm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold">Ajouter un bus</h3>
                <button onClick={() => setShowBusForm(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
                  <XCircle className="w-6 h-6 text-muted-foreground" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Numéro Bus</label>
                  <input type="text" placeholder="Ex: Bus #09" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Capacité</label>
                  <input type="number" placeholder="Ex: 30" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Chauffeur</label>
                  <select className="w-full bg-background border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20">
                    <option>Sélectionner un chauffeur</option>
                    <option>Mohammed Alami</option>
                    <option>Youssef Tazi</option>
                  </select>
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Zone Couverte</label>
                  <input type="text" placeholder="Ex: Malabata" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowBusForm(false)} className="flex-1 px-4 py-3 border border-border rounded-xl font-bold hover:bg-muted transition-all">Annuler</button>
                <button onClick={() => setShowBusForm(false)} className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20">Enregistrer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animation for Bus Move */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes bus-move {
          0% { left: -10%; top: 50%; }
          25% { left: 25%; top: 40%; }
          50% { left: 50%; top: 60%; }
          75% { left: 75%; top: 45%; }
          100% { left: 110%; top: 50%; }
        }
      `}} />
    </div>
  );
}

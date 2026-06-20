import { useState } from 'react';
import { 
  ArrowLeft, 
  Edit, 
  Phone, 
  MapPin, 
  Calendar, 
  User, 
  Shield, 
  Info, 
  FileText, 
  Clock, 
  CreditCard 
} from 'lucide-react';
import { cn } from '../../lib/utils';

export default function StudentDetail({ student, onBack, onEdit }) {
  const [activeTab, setActiveTab] = useState('infos');

  const tabs = [
    { id: 'infos', label: 'Infos générales', icon: Info },
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'absences', label: 'Absences', icon: Clock },
    { id: 'paiements', label: 'Paiements', icon: CreditCard },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Back Button & Actions */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
        >
          <div className="p-2 rounded-xl bg-muted group-hover:bg-primary/10 group-hover:text-primary transition-all">
            <ArrowLeft className="w-5 h-5" />
          </div>
          <span className="font-semibold">Retour à la liste</span>
        </button>
        <button 
          onClick={onEdit}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all font-semibold"
        >
          <Edit className="w-5 h-5" />
          Modifier le profil
        </button>
      </div>

      {/* Profile Header Card */}
      <div className="glass border border-border/50 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative flex flex-col md:flex-row items-center gap-8">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2rem] bg-gradient-to-br from-primary/20 to-blue-600/20 p-1 border border-border/50 shadow-xl group-hover:scale-105 transition-transform duration-500 overflow-hidden">
            <img src={student.photo} alt={student.nom} className="w-full h-full object-cover rounded-[1.8rem]" />
          </div>
          
          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-black tracking-tight">{student.prenom} {student.nom}</h1>
                <span className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest",
                  student.statut === 'Actif' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                )}>
                  {student.statut}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-muted-foreground font-medium">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <span>Code Massar: <span className="text-foreground font-bold">{student.codeMassar}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span>Classe: <span className="text-foreground font-bold">{student.classe}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>Niveau: <span className="text-foreground font-bold">{student.niveau}</span></span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl pt-2">
              <div className="bg-muted/30 p-4 rounded-2xl border border-border/50 text-center">
                <p className="text-xs text-muted-foreground font-bold uppercase mb-1">Moyenne</p>
                <p className="text-xl font-black text-primary">16.45</p>
              </div>
              <div className="bg-muted/30 p-4 rounded-2xl border border-border/50 text-center">
                <p className="text-xs text-muted-foreground font-bold uppercase mb-1">Absences</p>
                <p className="text-xl font-black text-rose-500">2 j</p>
              </div>
              <div className="bg-muted/30 p-4 rounded-2xl border border-border/50 text-center">
                <p className="text-xs text-muted-foreground font-bold uppercase mb-1">Retards</p>
                <p className="text-xl font-black text-amber-500">0</p>
              </div>
              <div className="bg-muted/30 p-4 rounded-2xl border border-border/50 text-center">
                <p className="text-xs text-muted-foreground font-bold uppercase mb-1">Conduite</p>
                <p className="text-xl font-black text-emerald-500">A+</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-muted/30 rounded-[2rem] border border-border/50 w-fit mx-auto md:mx-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all",
              activeTab === tab.id 
                ? "bg-card text-primary shadow-lg shadow-black/5" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className={cn("w-5 h-5", activeTab === tab.id ? "text-primary" : "")} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="glass border border-border/50 rounded-[2.5rem] p-8 min-h-[400px]">
        {activeTab === 'infos' && (
          <div className="animate-in fade-in slide-in-from-left-4 duration-500">
            <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <User className="w-6 h-6" />
              </div>
              Informations Personnelles
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div className="group/item">
                  <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Date de Naissance
                  </p>
                  <p className="text-lg font-semibold bg-muted/20 p-4 rounded-2xl border border-transparent group-hover/item:border-border transition-all">
                    {new Date(student.dateNaissance).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                
                <div className="group/item">
                  <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Adresse Résidentielle
                  </p>
                  <p className="text-lg font-semibold bg-muted/20 p-4 rounded-2xl border border-transparent group-hover/item:border-border transition-all">
                    {student.adresse}
                  </p>
                </div>
              </div>

              <div className="space-y-8">
                <div className="group/item">
                  <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" /> Nom du Tuteur (Parent)
                  </p>
                  <p className="text-lg font-semibold bg-muted/20 p-4 rounded-2xl border border-transparent group-hover/item:border-border transition-all">
                    {student.parentNom}
                  </p>
                </div>
                
                <div className="group/item">
                  <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4" /> Téléphone de Contact
                  </p>
                  <p className="text-lg font-semibold bg-muted/20 p-4 rounded-2xl border border-transparent group-hover/item:border-border transition-all flex items-center justify-between">
                    {student.parentTelephone}
                    <button className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all">
                      <Phone className="w-4 h-4" />
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab !== 'infos' && (
          <div className="h-[300px] flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
              <div className="relative w-24 h-24 bg-gradient-to-br from-primary/10 to-blue-600/10 rounded-3xl flex items-center justify-center mx-auto shadow-2xl border border-border/50">
                <span className="text-4xl opacity-50">📁</span>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">Module {activeTab}</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Les données pour la section <span className="text-primary font-bold">"{activeTab}"</span> ne sont pas encore disponibles pour cet élève.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

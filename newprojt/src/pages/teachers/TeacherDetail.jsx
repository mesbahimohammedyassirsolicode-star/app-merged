import { useState } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  User, 
  BookOpen, 
  FileText,
  CreditCard,
  CalendarDays
} from 'lucide-react';
import { cn } from '../../lib/utils';

export default function TeacherDetail({ teacher, onBack }) {
  const [activeTab, setActiveTab] = useState('infos');

  const tabs = [
    { id: 'infos', label: 'Infos personnelles', icon: User },
    { id: 'classes', label: 'Classes & Emploi du temps', icon: CalendarDays },
    { id: 'documents', label: 'Documents', icon: FileText },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Back Button & Actions */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group"
        >
          <div className="p-2 rounded-xl bg-card border border-border group-hover:bg-primary/10 group-hover:border-primary/20 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </div>
          <span className="font-medium">Retour à la liste</span>
        </button>
      </div>

      {/* Profile Header Card */}
      <div className="relative glass border border-border/50 rounded-[2.5rem] p-8 overflow-hidden shadow-2xl bg-card/30 backdrop-blur-md">
        <div className="absolute top-0 right-0 p-8">
           <span className={cn(
             "px-4 py-1.5 rounded-full text-xs font-bold border flex items-center gap-2",
             teacher.statut === 'Actif' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20"
           )}>
             <span className={cn("w-2 h-2 rounded-full", teacher.statut === 'Actif' ? "bg-emerald-500" : "bg-rose-500")} />
             {teacher.statut}
           </span>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-br from-primary to-blue-600 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-[2rem] bg-card border-2 border-border overflow-hidden transform group-hover:scale-[1.02] transition-transform duration-500 shadow-2xl">
              <img src={teacher.photo} alt={teacher.nom} className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="text-center md:text-left space-y-4">
            <div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">{teacher.prenom} {teacher.nom}</h2>
              <p className="text-xl text-primary font-semibold mt-1 flex items-center justify-center md:justify-start gap-2">
                <BookOpen className="w-6 h-6" />
                Enseignant de {teacher.matiere}
              </p>
            </div>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <div className="flex items-center gap-2 text-muted-foreground bg-muted/30 px-4 py-2 rounded-2xl border border-border/50">
                <Phone className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{teacher.telephone}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground bg-muted/30 px-4 py-2 rounded-2xl border border-border/50">
                <Mail className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{teacher.email}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex p-1.5 bg-card/50 backdrop-blur-md rounded-3xl border border-border/50 w-full md:w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-3 px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-300",
              activeTab === tab.id 
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="glass border border-border/50 rounded-[2.5rem] p-8 shadow-sm bg-card/30 backdrop-blur-md min-h-[400px]">
        {activeTab === 'infos' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-left-4 duration-500">
            <InfoItem icon={CreditCard} label="CIN / Passport" value={teacher.cin} />
            <InfoItem icon={Calendar} label="Date de naissance" value={new Date(teacher.dateNaissance).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} />
            <InfoItem icon={CalendarDays} label="Date de recrutement" value={new Date(teacher.dateRecrutement).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} />
            <InfoItem icon={Phone} label="Téléphone" value={teacher.telephone} />
            <InfoItem icon={Mail} label="Email Professionnel" value={teacher.email} />
            <InfoItem icon={MapPin} label="Adresse" value={teacher.adresse} />
          </div>
        )}

        {activeTab === 'classes' && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
              <CalendarDays className="w-12 h-12 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-foreground">Classes & Emploi du temps</h3>
              <p className="text-muted-foreground max-w-md mx-auto mt-2">
                Le module de gestion des emplois du temps est en cours de configuration pour cet enseignant.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
               {teacher.classes.map((cls, i) => (
                 <span key={i} className="px-4 py-2 rounded-xl bg-card border border-border text-foreground font-medium">
                   {cls}
                 </span>
               ))}
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
              <FileText className="w-12 h-12 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-foreground">Documents Administratifs</h3>
              <p className="text-muted-foreground max-w-md mx-auto mt-2">
                Aucun document n'a été téléversé pour le moment.
              </p>
            </div>
            <button className="px-6 py-3 rounded-2xl bg-muted border border-border hover:bg-accent transition-all font-semibold flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Ajouter un document
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="space-y-2 group">
      <div className="flex items-center gap-2 text-primary">
        <Icon className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
      </div>
      <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 group-hover:border-primary/30 transition-colors">
        <p className="text-foreground font-semibold">{value || 'Non renseigné'}</p>
      </div>
    </div>
  );
}

function Plus({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14"/><path d="M12 5v14"/>
    </svg>
  );
}

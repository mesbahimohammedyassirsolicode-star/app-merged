import { UserPlus, Search, FileText, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const actions = [
  { icon: UserPlus, label: 'Ajouter un élève', description: 'Inscrire un nouvel étudiant', color: 'bg-blue-500', route: '/eleves' },
  { icon: Search, label: 'Profil Élève 360°', description: 'Recherche globale avancée', color: 'bg-purple-500', route: '/eleves' },
  { icon: FileText, label: 'Imprimer un rapport', description: 'Stats & PDFs mensuels', color: 'bg-emerald-500', route: '/bulletins' },
];

export default function QuickActions() {
  const navigate = useNavigate();
  
  return (
    <div className="space-y-4">
      {actions.map((action, i) => (
        <button 
          key={i}
          onClick={() => navigate(action.route)}
          className="w-full flex items-center gap-4 p-4 rounded-2xl glass border border-border/50 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 group text-left relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className={`relative z-10 w-10 h-10 rounded-xl ${action.color} flex items-center justify-center text-white shrink-0 shadow-lg shadow-${action.color.split('-')[1]}-500/20 group-hover:scale-110 transition-transform duration-500`}>
            <action.icon className="w-5 h-5" />
          </div>
          <div className="relative z-10 flex-1 min-w-0">
            <h4 className="font-semibold text-sm truncate">{action.label}</h4>
            <p className="text-xs text-muted-foreground truncate">{action.description}</p>
          </div>
          <ArrowRight className="relative z-10 w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-all group-hover:text-primary" />
        </button>
      ))}

      <div className="mt-8 p-6 rounded-3xl bg-gradient-to-br from-primary/10 to-blue-600/5 border border-primary/20 relative overflow-hidden">
        <div className="relative z-10">
          <h4 className="font-bold text-lg mb-2">Support Premium</h4>
          <p className="text-sm text-muted-foreground mb-4">Besoin d'aide pour configurer vos classes ?</p>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
            Contacter un expert
          </button>
        </div>
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />
      </div>
    </div>
  );
}

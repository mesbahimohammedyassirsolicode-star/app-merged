import { Plus, Eye, Edit2, Trash2, School, User } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function ClassList({ classes, onAdd, onEdit, onDelete, onView }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des Classes</h1>
          <p className="text-muted-foreground mt-1">Gérez les classes, les enseignants principaux et les capacités.</p>
        </div>
        <button 
          onClick={onAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground hover:opacity-90 transition-all shadow-lg shadow-primary/20 font-semibold"
        >
          <Plus className="w-5 h-5" />
          Ajouter une classe
        </button>
      </div>

      {/* Table Section */}
      <div className="glass border border-border/50 rounded-[2rem] shadow-sm overflow-hidden group hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/50 bg-muted/20">
                <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Classe</th>
                <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Niveau</th>
                <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Enseignant Principal</th>
                <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-muted-foreground text-center">Élèves / Capacité</th>
                <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Statut</th>
                <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {classes.map((classe) => (
                <tr key={classe.id} className="hover:bg-muted/30 transition-colors group/row">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0 group-hover/row:scale-110 transition-transform">
                        <School className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-foreground">{classe.nom}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-muted-foreground bg-muted/30 px-2 py-1 rounded-lg">
                      {classe.niveauNom}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <User className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <span className="text-sm font-semibold">{classe.enseignant}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-mono text-sm font-bold">
                        {classe.studentsCount} / {classe.capacite}
                      </span>
                      <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            (classe.studentsCount / classe.capacite) > 0.9 ? "bg-rose-500" : "bg-primary"
                          )}
                          style={{ width: `${Math.min(100, (classe.studentsCount / classe.capacite) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold",
                      classe.statut === 'Actif' 
                        ? "bg-emerald-500/10 text-emerald-500" 
                        : "bg-rose-500/10 text-rose-500"
                    )}>
                      {classe.statut}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => onView(classe)}
                        className="p-2 rounded-xl hover:bg-primary/10 hover:text-primary transition-all group/btn"
                        title="Voir la liste des élèves"
                      >
                        <Eye className="w-5 h-5 transition-transform group-hover/btn:scale-110" />
                      </button>
                      <button 
                        onClick={() => onEdit(classe)}
                        className="p-2 rounded-xl hover:bg-blue-500/10 hover:text-blue-500 transition-all group/btn"
                        title="Modifier"
                      >
                        <Edit2 className="w-5 h-5 transition-transform group-hover/btn:scale-110" />
                      </button>
                      <button 
                        onClick={() => onDelete(classe.id)}
                        className="p-2 rounded-xl hover:bg-rose-500/10 hover:text-rose-500 transition-all group/btn"
                        title="Supprimer"
                      >
                        <Trash2 className="w-5 h-5 transition-transform group-hover/btn:scale-110" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import { Plus, Edit2, Trash2, Layers } from 'lucide-react';

export default function NiveauList({ niveaux, onAdd, onEdit, onDelete }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des Niveaux</h1>
          <p className="text-muted-foreground mt-1">Configurez les niveaux d'enseignement de votre établissement.</p>
        </div>
        <button 
          onClick={onAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground hover:opacity-90 transition-all shadow-lg shadow-primary/20 font-semibold"
        >
          <Plus className="w-5 h-5" />
          Ajouter un niveau
        </button>
      </div>

      {/* Table Section */}
      <div className="glass border border-border/50 rounded-[2rem] shadow-sm overflow-hidden group hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/50 bg-muted/20">
                <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Nom du niveau</th>
                <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Description</th>
                <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-muted-foreground text-center">Classes</th>
                <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-muted-foreground text-center">Élèves</th>
                <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {niveaux.map((niveau) => (
                <tr key={niveau.id} className="hover:bg-muted/30 transition-colors group/row">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover/row:scale-110 transition-transform">
                        <Layers className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-foreground">{niveau.nom}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">
                    {niveau.description}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-mono text-sm bg-muted/50 px-3 py-1 rounded-lg border border-border/50">
                      {niveau.classesCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-mono text-sm bg-primary/5 text-primary px-3 py-1 rounded-lg border border-primary/20">
                      {niveau.studentsCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => onEdit(niveau)}
                        className="p-2 rounded-xl hover:bg-blue-500/10 hover:text-blue-500 transition-all group/btn"
                        title="Modifier"
                      >
                        <Edit2 className="w-5 h-5 transition-transform group-hover/btn:scale-110" />
                      </button>
                      <button 
                        onClick={() => onDelete(niveau.id)}
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

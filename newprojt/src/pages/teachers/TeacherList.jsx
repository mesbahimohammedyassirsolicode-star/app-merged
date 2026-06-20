import { useState } from 'react';
import { 
  Search, 
  Eye, 
  Edit2, 
  Trash2, 
  ChevronLeft,
  ChevronRight,
  UserPlus,
  BookOpen
} from 'lucide-react';
import { cn } from '../../lib/utils';

export default function TeacherList({ teachers, onView, onEdit, onDelete, onAdd }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tous');
  const [matiereFilter, setMatiereFilter] = useState('Tous');

  const matieres = ['Tous', ...new Set(teachers.map(t => t.matiere))];

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Filter logic
  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = 
      teacher.nom.toLowerCase().includes(searchTerm.toLowerCase()) || 
      teacher.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.matiere.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'Tous' || teacher.statut === statusFilter;
    const matchesMatiere = matiereFilter === 'Tous' || teacher.matiere === matiereFilter;

    return matchesSearch && matchesStatus && matchesMatiere;
  });

  const totalPages = Math.ceil(filteredTeachers.length / itemsPerPage);
  const paginatedTeachers = filteredTeachers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Liste des Enseignants</h1>
          <p className="text-muted-foreground mt-1">Gérez le corps enseignant et leurs affectations.</p>
        </div>
        <button 
          onClick={onAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground hover:opacity-90 transition-all shadow-lg shadow-primary/20 font-semibold"
        >
          <UserPlus className="w-5 h-5" />
          Ajouter un enseignant
        </button>
      </div>

      {/* Filters & Search Bar */}
      <div className="glass border border-border/50 rounded-[2rem] p-6 shadow-sm bg-card/30 backdrop-blur-md">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Rechercher par nom ou matière..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-muted/30 border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="flex p-1 bg-muted/30 rounded-2xl border border-border/50">
            {['Tous', 'Actifs', 'Inactifs'].map((status) => (
              <button
                key={status}
                onClick={() => {
                  const next =
                    status === 'Actifs' ? 'Actif' : status === 'Inactifs' ? 'Inactif' : 'Tous';
                  setStatusFilter(next);
                  setCurrentPage(1);
                }}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                  (statusFilter === (status === 'Actifs' ? 'Actif' : status === 'Inactifs' ? 'Inactif' : 'Tous'))
                    ? "bg-card text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Matière Filter */}
          <div className="relative w-full lg:w-48">
            <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <select 
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-muted/30 border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none transition-all text-sm font-medium text-foreground"
              value={matiereFilter}
              onChange={(e) => {
                setMatiereFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              {matieres.map(m => (
                <option key={m} value={m}>{m === 'Tous' ? 'Toutes les matières' : m}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="glass border border-border/50 rounded-[2rem] shadow-sm overflow-hidden group hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 bg-card/30 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/50 bg-muted/20">
                <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Enseignant</th>
                <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Matière</th>
                <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Classes</th>
                <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Téléphone</th>
                <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Statut</th>
                <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {paginatedTeachers.length > 0 ? paginatedTeachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-muted/30 transition-colors group/row">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-blue-600/20 flex items-center justify-center border border-border/50 overflow-hidden shrink-0 group-hover/row:scale-110 transition-transform">
                        <img src={teacher.photo} alt={teacher.nom} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{teacher.prenom} {teacher.nom}</p>
                        <p className="text-xs text-muted-foreground">ID: #ENS-{teacher.id.toString().padStart(4, '0')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-foreground bg-primary/5 px-3 py-1 rounded-full border border-primary/10">
                      {teacher.matiere}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {(teacher.classes || []).slice(0, 2).map((cls, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/50 whitespace-nowrap">
                          {cls}
                        </span>
                      ))}
                      {(teacher.classes || []).length > 2 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/10">
                          +{(teacher.classes || []).length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">{teacher.telephone}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold",
                      teacher.statut === 'Actif' 
                        ? "bg-emerald-500/10 text-emerald-500" 
                        : "bg-rose-500/10 text-rose-500"
                    )}>
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full animate-pulse",
                        teacher.statut === 'Actif' ? "bg-emerald-500" : "bg-rose-500"
                      )} />
                      {teacher.statut}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => onView(teacher)}
                        className="p-2 rounded-xl hover:bg-primary/10 hover:text-primary transition-all group/btn"
                        title="Voir la fiche"
                      >
                        <Eye className="w-5 h-5 transition-transform group-hover/btn:scale-110" />
                      </button>
                      <button 
                        onClick={() => onEdit(teacher)}
                        className="p-2 rounded-xl hover:bg-blue-500/10 hover:text-blue-500 transition-all group/btn"
                        title="Modifier"
                      >
                        <Edit2 className="w-5 h-5 transition-transform group-hover/btn:scale-110" />
                      </button>
                      <button 
                        onClick={() => onDelete(teacher.id)}
                        className="p-2 rounded-xl hover:bg-rose-500/10 hover:text-rose-500 transition-all group/btn"
                        title="Supprimer"
                      >
                        <Trash2 className="w-5 h-5 transition-transform group-hover/btn:scale-110" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4 opacity-50">
                      <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
                        <BookOpen className="w-10 h-10" />
                      </div>
                      <p className="text-xl font-medium">Aucun enseignant trouvé</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-border/50 flex items-center justify-between bg-muted/10">
          <p className="text-sm text-muted-foreground">
            Affichage de <span className="font-bold text-foreground">{paginatedTeachers.length}</span> sur <span className="font-bold text-foreground">{filteredTeachers.length}</span> enseignants
          </p>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl border border-border bg-card hover:bg-accent disabled:opacity-50 transition-all text-foreground"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1">
              {[...Array(totalPages)].map((_, i) => (
                <button 
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={cn(
                    "w-8 h-8 rounded-lg font-bold text-xs transition-all",
                    currentPage === i + 1 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-accent text-foreground"
                  )}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-2 rounded-xl border border-border bg-card hover:bg-accent disabled:opacity-50 transition-all text-foreground"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

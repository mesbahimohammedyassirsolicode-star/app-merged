import { ArrowLeft, Users, GraduationCap } from 'lucide-react';
import { mockClassStudents } from '../../data/mockAcademic';

export default function ClassDetail({ classe, onBack }) {
  // Use mock students for this class or empty if not found
  const students = mockClassStudents[classe.id] || mockClassStudents[1] || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-3 rounded-2xl bg-muted/50 border border-border/50 hover:bg-muted transition-all group"
          >
            <ArrowLeft className="w-6 h-6 transition-transform group-hover:-translate-x-1" />
          </button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Classe {classe.nom}</h1>
            <div className="flex items-center gap-3 text-muted-foreground mt-1">
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">
                {classe.niveauNom}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <GraduationCap className="w-4 h-4" />
                {classe.enseignant}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="glass border border-border/50 rounded-2xl px-6 py-3 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-bold uppercase">Total Élèves</p>
              <p className="text-xl font-bold">{classe.studentsCount} / {classe.capacite}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Student List Table */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold px-1">Liste des Élèves</h2>
        <div className="glass border border-border/50 rounded-[2rem] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/50 bg-muted/20">
                  <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">ID</th>
                  <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Nom Complet</th>
                  <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Code Massar</th>
                  <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-muted-foreground text-right">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono text-muted-foreground">
                      #ST-{student.id.toString().padStart(4, '0')}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold">{student.prenom} {student.nom}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono bg-muted px-2 py-1 rounded border border-border/50">
                        {student.codeMassar}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500">
                        Inscrit
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

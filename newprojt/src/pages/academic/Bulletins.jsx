import { useState } from 'react';
import { 
  Filter, 
  Save, 
  FileText, 
  Printer, 
  Plus, 
  CheckCircle2, 
  MoreVertical,
  GraduationCap,
  MessageSquare
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { mockSubjects, mockStudentsNotes, mockBulletins } from '../../data/mockNotes';
import BulletinPreview from './BulletinPreview';

export default function Bulletins() {
  const [activeSubTab, setActiveSubTab] = useState('notes'); // 'notes' or 'bulletins'
  const [selectedClass, setSelectedClass] = useState('1A');
  const [selectedSubject, setSelectedSubject] = useState('Maths');
  const [selectedTrimestre, setSelectedTrimestre] = useState('T1');
  const [showPreview, setShowPreview] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showToast, setShowToast] = useState(null);

  const triggerToast = (message) => {
    setShowToast(message);
    setTimeout(() => setShowToast(null), 3000);
  };

  const getNoteColor = (note) => {
    if (note < 10) return 'text-red-500 bg-red-500/10 border-red-500/20';
    if (note >= 10 && note <= 12) return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
    return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
  };

  const getMentionBadge = (mention) => {
    switch (mention) {
      case 'Excellent': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'Très Bien': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Bien': return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
      case 'Assez Bien': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'Passable': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      case 'Insuffisant': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  if (showPreview && selectedStudent) {
    return <BulletinPreview student={selectedStudent} onBack={() => setShowPreview(false)} />;
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-24 right-8 z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">{showToast}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bulletins & Notes</h1>
          <p className="text-muted-foreground mt-1">Gérez les évaluations et générez les bulletins scolaires.</p>
        </div>
        <div className="flex items-center gap-3">
          {activeSubTab === 'bulletins' && (
            <button 
              onClick={() => triggerToast('Tous les bulletins ont été générés avec succès !')}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
            >
              <Plus className="w-4 h-4" />
              Générer tous les bulletins
            </button>
          )}
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex p-1 bg-card border border-border rounded-2xl w-fit">
        <button
          onClick={() => setActiveSubTab('notes')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2",
            activeSubTab === 'notes' 
              ? "bg-background text-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <GraduationCap className="w-4 h-4" />
          Saisie des notes
        </button>
        <button
          onClick={() => setActiveSubTab('bulletins')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2",
            activeSubTab === 'bulletins' 
              ? "bg-background text-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <FileText className="w-4 h-4" />
          Bulletins
        </button>
      </div>

      {activeSubTab === 'notes' ? (
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Section 1: Saisie des notes - Filter Bar */}
          <div className="bg-card border border-border rounded-[2rem] p-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium px-1">Classe</label>
                <select 
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                >
                  <option value="1A">1ère Année (1A)</option>
                  <option value="1B">1ère Année (1B)</option>
                  <option value="2A">2ème Année (2A)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium px-1">Matière</label>
                <select 
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                >
                  {mockSubjects.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium px-1">Trimestre</label>
                <select 
                  value={selectedTrimestre}
                  onChange={(e) => setSelectedTrimestre(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                >
                  <option value="T1">Trimestre 1 (T1)</option>
                  <option value="T2">Trimestre 2 (T2)</option>
                  <option value="T3">Trimestre 3 (T3)</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 px-4 py-2.5 bg-accent text-accent-foreground rounded-xl font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filtrer
                </button>
              </div>
            </div>
          </div>

          {/* Section 1: Saisie des notes - Table */}
          <div className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Élève</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider w-32">{selectedSubject}</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Commentaire</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {mockStudentsNotes.map((student) => (
                    <tr key={student.id} className="hover:bg-muted/50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {student.prenom[0]}{student.nom[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{student.prenom} {student.nom}</p>
                            <p className="text-xs text-muted-foreground">{student.classe}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <input 
                            type="number" 
                            min="0" 
                            max="20"
                            defaultValue={student.notes[selectedSubject]}
                            className={cn(
                              "w-20 px-3 py-2 rounded-xl text-center font-bold border outline-none focus:ring-4 transition-all",
                              getNoteColor(student.notes[selectedSubject])
                            )}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <input 
                          type="text" 
                          placeholder="Ajouter une appréciation..."
                          className="w-full bg-transparent border-none outline-none text-sm text-muted-foreground italic focus:text-foreground"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <button className="p-2 rounded-lg hover:bg-accent text-muted-foreground group-hover:text-primary transition-colors">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-6 border-t border-border flex justify-end">
              <button 
                onClick={() => triggerToast('Notes enregistrées avec succès !')}
                className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20"
              >
                <Save className="w-4 h-4" />
                Enregistrer les notes
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Section 2: Bulletins - Table */}
          <div className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Élève</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Classe</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trimestre</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Moyenne</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mention</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {mockBulletins.map((bulletin) => (
                    <tr key={bulletin.id} className="hover:bg-muted/50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-semibold text-foreground">{bulletin.nom}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm">{bulletin.classe}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium">{bulletin.trimestre}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold">{bulletin.moyenne.toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-semibold border",
                          getMentionBadge(bulletin.mention)
                        )}>
                          {bulletin.mention}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            bulletin.statut === 'Généré' ? "bg-emerald-500" : "bg-amber-500"
                          )}></div>
                          <span className="text-sm text-muted-foreground">{bulletin.statut}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => {
                              setSelectedStudent(bulletin);
                              setShowPreview(true);
                            }}
                            className="p-2 rounded-lg bg-accent/50 text-accent-foreground hover:bg-accent transition-colors"
                            title="Imprimer"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => triggerToast(`Bulletin envoyé à ${bulletin.nom} via WhatsApp !`)}
                            className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors"
                            title="Envoyer via WhatsApp"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button className="p-2 rounded-lg hover:bg-accent text-muted-foreground transition-colors">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-6 border-t border-border flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Affichage de 10 élèves</p>
              <div className="flex items-center gap-2">
                <button className="px-4 py-2 border border-border rounded-xl text-sm font-medium disabled:opacity-50" disabled>Précédent</button>
                <button className="px-4 py-2 border border-border rounded-xl text-sm font-medium">Suivant</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

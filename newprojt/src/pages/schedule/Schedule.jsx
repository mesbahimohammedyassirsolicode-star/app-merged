import { useState } from 'react';
import { 
  Plus, 
  Printer, 
  User, 
  Users, 
  ChevronLeft, 
  ChevronRight
} from 'lucide-react';
import { cn } from '../../lib/utils';
import ScheduleGrid from './ScheduleGrid';
import ScheduleForm from './ScheduleForm';
import PrintSchedule from './PrintSchedule';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import emploiDuTempsService from '../../services/emploiDuTempsService';
import { CLASSES, TEACHERS } from '../../data/mockSchedule';
import { Loader2 } from 'lucide-react';

export default function Schedule() {
  const [view, setView] = useState('grid'); // 'grid', 'form', 'print'
  const [filterMode, setFilterMode] = useState('classe'); // 'classe', 'enseignant'
  const [selectedClasse, setSelectedClasse] = useState(CLASSES[0].id);
  const [selectedTeacher, setSelectedTeacher] = useState(TEACHERS[0].id);
  const [currentWeek, setCurrentWeek] = useState('Semaine du 11 Mai 2026');
  const queryClient = useQueryClient();

  // Queries
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['schedule', filterMode, filterMode === 'classe' ? selectedClasse : selectedTeacher],
    queryFn: () => emploiDuTempsService.getAll({ 
      [filterMode === 'classe' ? 'classe_id' : 'enseignant_id']: filterMode === 'classe' ? selectedClasse : selectedTeacher 
    })
  });

  const createMutation = useMutation({
    mutationFn: emploiDuTempsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      setView('grid');
    }
  });

  // Filter sessions based on current selection (kept as fallback if api doesn't filter perfectly)
  const filteredSessions = sessions.filter(s => {
    if (filterMode === 'classe') return s.classId === selectedClasse;
    return s.teacherId === selectedTeacher;
  });

  const handleAddSession = (newSession) => {
    createMutation.mutate(newSession);
  };

  if (isLoading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Emploi du Temps</h1>
          <p className="text-muted-foreground">Gérez et consultez les plannings hebdomadaires.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setView('print')}
            className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-xl hover:bg-secondary/80 transition-all font-medium"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer</span>
          </button>
          <button 
            onClick={() => setView('form')}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all font-medium shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter une séance</span>
          </button>
        </div>
      </div>

      {view === 'grid' && (
        <>
          {/* Controls Bar */}
          <div className="bg-card/50 backdrop-blur-xl border border-border/50 p-4 rounded-3xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 bg-background/50 p-1 rounded-2xl border border-border">
              <button
                onClick={() => setFilterMode('classe')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                  filterMode === 'classe' ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Users className="w-4 h-4" />
                <span>Par Classe</span>
              </button>
              <button
                onClick={() => setFilterMode('enseignant')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                  filterMode === 'enseignant' ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <User className="w-4 h-4" />
                <span>Par Enseignant</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">
                  {filterMode === 'classe' ? 'Classe :' : 'Enseignant :'}
                </span>
                <select 
                  value={filterMode === 'classe' ? selectedClasse : selectedTeacher}
                  onChange={(e) => filterMode === 'classe' ? setSelectedClasse(e.target.value) : setSelectedTeacher(e.target.value)}
                  className="bg-background border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                >
                  {filterMode === 'classe' ? (
                    CLASSES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)
                  ) : (
                    TEACHERS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)
                  )}
                </select>
              </div>

              <div className="flex items-center gap-2 bg-background border border-border rounded-xl px-3 py-1.5">
                <button
                  type="button"
                  className="p-1 hover:bg-accent rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                  onClick={() => setCurrentWeek('Semaine du 4 Mai 2026')}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-semibold px-2">{currentWeek}</span>
                <button
                  type="button"
                  className="p-1 hover:bg-accent rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                  onClick={() => setCurrentWeek('Semaine du 18 Mai 2026')}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Grid View */}
          <div className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <ScheduleGrid 
              sessions={filteredSessions} 
              onEmptyCellClick={() => setView('form')}
              mode={filterMode}
            />
          </div>
        </>
      )}

      {view === 'form' && (
        <div className="bg-card border border-border rounded-[2.5rem] p-8 max-w-3xl mx-auto shadow-2xl">
          <div className="flex items-center gap-4 mb-8">
            <button 
              onClick={() => setView('grid')}
              className="p-3 bg-secondary/50 text-secondary-foreground rounded-2xl hover:bg-secondary transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold">Nouvelle Séance</h2>
          </div>
          <ScheduleForm 
            onSave={handleAddSession} 
            onCancel={() => setView('grid')} 
            existingSessions={sessions}
          />
        </div>
      )}

      {view === 'print' && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setView('grid')}
              className="p-3 bg-secondary/50 text-secondary-foreground rounded-2xl hover:bg-secondary transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold">Aperçu Impression</h2>
          </div>
          <PrintSchedule 
            sessions={filteredSessions} 
            title={filterMode === 'classe' ? CLASSES.find(c => c.id === selectedClasse)?.label : TEACHERS.find(t => t.id === selectedTeacher)?.name}
            week={currentWeek}
          />
        </div>
      )}
    </div>
  );
}

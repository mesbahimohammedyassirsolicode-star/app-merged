import { useState } from 'react';
import AbsenceOverview from './AbsenceOverview';
import AbsenceForm from './AbsenceForm';
import AbsenceReport from './AbsenceReport';

export default function Absences() {
  const [currentView, setCurrentView] = useState('overview'); // 'overview', 'form', 'report'

  const renderView = () => {
    switch (currentView) {
      case 'overview':
        return <AbsenceOverview onAdd={() => setCurrentView('form')} onViewReport={() => setCurrentView('report')} />;
      case 'form':
        return <AbsenceForm onCancel={() => setCurrentView('overview')} onSuccess={() => setCurrentView('overview')} />;
      case 'report':
        return <AbsenceReport onBack={() => setCurrentView('overview')} />;
      default:
        return <AbsenceOverview onAdd={() => setCurrentView('form')} onViewReport={() => setCurrentView('report')} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            Gestion des Absences
          </h1>
          <p className="text-muted-foreground mt-1">
            Suivi, enregistrement et analyse des absences des élèves.
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-card/50 p-1 rounded-xl border border-border w-fit">
          <button
            onClick={() => setCurrentView('overview')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              currentView === 'overview' 
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            Vue générale
          </button>
          <button
            onClick={() => setCurrentView('report')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              currentView === 'report' 
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            Rapports
          </button>
        </div>
      </div>

      {renderView()}
    </div>
  );
}

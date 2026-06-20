import { useState } from 'react';
import { Save, X, School } from 'lucide-react';
import { mockLevels } from '../../data/mockAcademic';

function initialClassForm(classe) {
  if (!classe) {
    return { nom: '', niveauId: '', enseignant: '', capacite: 30 };
  }
  return {
    nom: classe.nom || '',
    niveauId: classe.niveauId != null ? String(classe.niveauId) : '',
    enseignant: classe.enseignant || '',
    capacite: classe.capacite || 30
  };
}

export default function ClassForm({ classe, onSave, onCancel, mode }) {
  const [formData, setFormData] = useState(() => initialClassForm(classe));

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedLevel = mockLevels.find(l => l.id === parseInt(formData.niveauId));
    onSave({
      ...formData,
      niveauNom: selectedLevel ? selectedLevel.nom : ''
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
            <School className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {mode === 'add' ? 'Nouvelle Classe' : 'Modifier la Classe'}
            </h1>
            <p className="text-muted-foreground">
              {mode === 'add' ? 'Configurez une nouvelle section.' : 'Mettez à jour les paramètres de la classe.'}
            </p>
          </div>
        </div>
        <button 
          onClick={onCancel}
          className="p-2 rounded-full hover:bg-muted transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="glass border border-border/50 rounded-[2rem] p-8 space-y-6 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground ml-1">Nom de la classe</label>
            <input 
              type="text" 
              required
              placeholder="Ex: 1A"
              className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              value={formData.nom}
              onChange={(e) => setFormData({...formData, nom: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground ml-1">Niveau</label>
            <select 
              required
              className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
              value={formData.niveauId}
              onChange={(e) => setFormData({...formData, niveauId: e.target.value})}
            >
              <option value="">Sélectionner un niveau</option>
              {mockLevels.map(level => (
                <option key={level.id} value={level.id}>{level.nom}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground ml-1">Enseignant Principal</label>
            <select 
              required
              className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
              value={formData.enseignant}
              onChange={(e) => setFormData({...formData, enseignant: e.target.value})}
            >
              <option value="">Sélectionner un enseignant</option>
              <option value="Ahmed Alami">Ahmed Alami</option>
              <option value="Sanaa Benali">Sanaa Benali</option>
              <option value="Youssef Tazi">Youssef Tazi</option>
              <option value="Laila Mansouri">Laila Mansouri</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground ml-1">Capacité Max</label>
            <input 
              type="number" 
              required
              min="1"
              max="50"
              className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              value={formData.capacite}
              onChange={(e) => setFormData({...formData, capacite: parseInt(e.target.value)})}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 pt-4">
          <button 
            type="button"
            onClick={onCancel}
            className="px-6 py-3 rounded-2xl border border-border font-semibold hover:bg-muted transition-all"
          >
            Annuler
          </button>
          <button 
            type="submit"
            className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-primary text-primary-foreground hover:opacity-90 transition-all shadow-lg shadow-primary/20 font-bold"
          >
            <Save className="w-5 h-5" />
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
}

import { useState } from 'react';
import { Save, X, Layers } from 'lucide-react';

function initialNiveauForm(niveau) {
  if (!niveau) {
    return { nom: '', description: '' };
  }
  return {
    nom: niveau.nom || '',
    description: niveau.description || ''
  };
}

export default function NiveauForm({ niveau, onSave, onCancel, mode }) {
  const [formData, setFormData] = useState(() => initialNiveauForm(niveau));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {mode === 'add' ? 'Nouveau Niveau' : 'Modifier le Niveau'}
            </h1>
            <p className="text-muted-foreground">
              {mode === 'add' ? 'Créez un nouveau niveau académique.' : 'Mettez à jour les informations du niveau.'}
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
        <div className="space-y-2">
          <label className="text-sm font-semibold text-muted-foreground ml-1">Nom du niveau</label>
          <input 
            type="text" 
            required
            placeholder="Ex: 1ère Année Primaire"
            className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            value={formData.nom}
            onChange={(e) => setFormData({...formData, nom: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-muted-foreground ml-1">Description</label>
          <textarea 
            rows="4"
            placeholder="Description optionnelle du niveau..."
            className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
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

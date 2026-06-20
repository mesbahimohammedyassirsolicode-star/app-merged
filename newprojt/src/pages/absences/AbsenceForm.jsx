import { useState } from 'react';
import { 
  X, 
  Search, 
  Calendar, 
  Clock, 
  FileUp, 
  AlignLeft, 
  Save, 
  ArrowLeft,
  AlertCircle
} from 'lucide-react';

export default function AbsenceForm({ onCancel, onSuccess }) {
  const [formData, setFormData] = useState({
    student: '',
    date: new Date().toISOString().split('T')[0],
    session: 'Matin',
    reason: 'Inconnu',
    note: ''
  });

  const students = [
    "Yassine El Amrani", "Fatima-Zahra Alaoui", "Mehdi Benjelloun", 
    "Leila Haddad", "Omar Mansouri", "Salma Tazi", "Amine Chraibi",
    "Kenza Belkhayat", "Driss Filali", "Meriem Bennani"
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSuccess();
  };

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-500 pb-12">
      <button 
        onClick={onCancel}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Retour à l'aperçu
      </button>

      <div className="bg-card border border-border rounded-[2.5rem] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-8 border-b border-border">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <AlertCircle className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Enregistrer une absence</h2>
              <p className="text-muted-foreground">Veuillez remplir les informations relatives à l'absence de l'élève.</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Student Search */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold ml-1 flex items-center gap-2">
                <Search className="w-4 h-4 text-primary" />
                Élève
              </label>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <select 
                  className="w-full pl-12 pr-4 py-4 bg-accent/30 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                  value={formData.student}
                  onChange={(e) => setFormData({...formData, student: e.target.value})}
                  required
                >
                  <option value="" disabled>Sélectionner un élève...</option>
                  {students.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                  <X className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <label className="text-sm font-semibold ml-1 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Date de l'absence
              </label>
              <input 
                type="date" 
                className="w-full px-4 py-4 bg-accent/30 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                required
              />
            </div>

            {/* Session */}
            <div className="space-y-2">
              <label className="text-sm font-semibold ml-1 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Séance
              </label>
              <select 
                className="w-full px-4 py-4 bg-accent/30 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                value={formData.session}
                onChange={(e) => setFormData({...formData, session: e.target.value})}
              >
                <option value="Matin">Matin</option>
                <option value="Après-midi">Après-midi</option>
                <option value="Journée entière">Journée entière</option>
              </select>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <label className="text-sm font-semibold ml-1 flex items-center gap-2">
                <AlignLeft className="w-4 h-4 text-primary" />
                Motif
              </label>
              <select 
                className="w-full px-4 py-4 bg-accent/30 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
              >
                <option value="Maladie">Maladie</option>
                <option value="Familial">Familial</option>
                <option value="Inconnu">Inconnu</option>
                <option value="Autre">Autre</option>
              </select>
            </div>

            {/* Justificatif */}
            <div className="space-y-2">
              <label className="text-sm font-semibold ml-1 flex items-center gap-2">
                <FileUp className="w-4 h-4 text-primary" />
                Justificatif (Optionnel)
              </label>
              <div className="relative">
                <input 
                  type="file" 
                  className="hidden" 
                  id="file-upload"
                />
                <label 
                  htmlFor="file-upload"
                  className="w-full px-4 py-4 bg-accent/30 border border-border border-dashed rounded-2xl flex items-center justify-center gap-3 cursor-pointer hover:bg-accent/50 transition-all group"
                >
                  <FileUp className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Cliquez pour téléverser</span>
                </label>
              </div>
            </div>

            {/* Note */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold ml-1 flex items-center gap-2">
                <AlignLeft className="w-4 h-4 text-primary" />
                Observations / Notes
              </label>
              <textarea 
                rows="4"
                placeholder="Détails supplémentaires sur l'absence..."
                className="w-full px-4 py-4 bg-accent/30 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                value={formData.note}
                onChange={(e) => setFormData({...formData, note: e.target.value})}
              ></textarea>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-6 border-t border-border">
            <button 
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
            >
              Annuler
            </button>
            <button 
              type="submit"
              className="w-full sm:w-auto px-10 py-4 bg-primary text-primary-foreground rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-xl shadow-primary/20 transform hover:-translate-y-1 active:translate-y-0"
            >
              <Save className="w-5 h-5" />
              Enregistrer l'absence
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

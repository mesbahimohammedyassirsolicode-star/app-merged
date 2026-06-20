import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import classeService from '../../services/classeService';
import { 
  Save, 
  Camera, 
  User, 
  Shield, 
  Calendar, 
  MapPin, 
  Phone,
  ArrowLeft
} from 'lucide-react';

const defaultStudentForm = {
  nom: '',
  prenom: '',
  codeMassar: '',
  dateNaissance: '',
  niveau: 'Primaire',
  classe: '',
  parentNom: '',
  parentTelephone: '',
  adresse: '',
  statut: 'Actif'
};

function initialStudentForm(student, mode) {
  if (mode === 'edit' && student) {
    return { ...defaultStudentForm, ...student };
  }
  return { ...defaultStudentForm };
}

export default function StudentForm({ student, onSave, onCancel, mode, isLoading, apiError }) {
  const [formData, setFormData] = useState(() => initialStudentForm(student, mode));

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classeService.getAll()
  });

  const errors = apiError?.response?.data?.errors || {};

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      nom: formData.nom,
      prenom: formData.prenom,
      code_massar: formData.codeMassar,
      date_naissance: formData.dateNaissance,
      classe_id: formData.classe,
      statut: formData.statut,
      adresse: formData.adresse,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onCancel}
            className="p-3 rounded-2xl bg-muted hover:bg-primary/10 hover:text-primary transition-all group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <h1 className="text-3xl font-black tracking-tight">
              {mode === 'add' ? 'Nouvel Élève' : 'Modifier l\'élève'}
            </h1>
            <p className="text-muted-foreground mt-1">Remplissez les informations ci-dessous pour {mode === 'add' ? 'créer un nouveau dossier' : 'mettre à jour le dossier'}.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Photo Upload Section */}
        <div className="glass border border-border/50 rounded-[2.5rem] p-8 shadow-sm">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative group">
              <div className="w-32 h-32 rounded-[2rem] bg-muted flex items-center justify-center border-2 border-dashed border-border group-hover:border-primary transition-colors overflow-hidden">
                {student?.photo ? (
                  <img src={student.photo} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-muted-foreground" />
                )}
              </div>
              <button type="button" className="absolute -bottom-2 -right-2 p-3 bg-primary text-primary-foreground rounded-2xl shadow-xl hover:scale-110 transition-transform">
                <Camera className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 text-center md:text-left space-y-2">
              <h3 className="text-xl font-bold">Photo de l'élève</h3>
              <p className="text-sm text-muted-foreground max-w-xs">Uploadez une photo claire au format JPG ou PNG. Taille max 2Mo.</p>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start pt-2">
                <button type="button" className="px-4 py-2 bg-muted hover:bg-accent rounded-xl text-xs font-bold transition-colors border border-border/50">Choisir un fichier</button>
                <button type="button" className="px-4 py-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl text-xs font-bold transition-all border border-rose-500/20">Supprimer</button>
              </div>
            </div>
          </div>
        </div>

        {/* General Information */}
        <div className="glass border border-border/50 rounded-[2.5rem] p-8 shadow-sm space-y-8">
          <h3 className="text-xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <Info className="w-5 h-5" />
            </div>
            Informations Générales
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground ml-1">Prénom</label>
              <input 
                type="text" 
                name="prenom"
                value={formData.prenom}
                onChange={handleChange}
                required
                className={`w-full px-5 py-3.5 rounded-2xl bg-muted/30 border ${errors.prenom ? 'border-rose-500' : 'border-border/50'} focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium`}
                placeholder="Ex: Yassine"
              />
              {errors.prenom && <p className="text-xs text-rose-500 mt-1">{errors.prenom[0]}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground ml-1">Nom</label>
              <input 
                type="text" 
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                required
                className={`w-full px-5 py-3.5 rounded-2xl bg-muted/30 border ${errors.nom ? 'border-rose-500' : 'border-border/50'} focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium`}
                placeholder="Ex: Amrani"
              />
              {errors.nom && <p className="text-xs text-rose-500 mt-1">{errors.nom[0]}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground ml-1">Code Massar</label>
              <input 
                type="text" 
                name="codeMassar"
                value={formData.codeMassar}
                onChange={handleChange}
                required
                className={`w-full px-5 py-3.5 rounded-2xl bg-muted/30 border ${errors.code_massar ? 'border-rose-500' : 'border-border/50'} focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium font-mono`}
                placeholder="Ex: K13456789"
              />
              {errors.code_massar && <p className="text-xs text-rose-500 mt-1">{errors.code_massar[0]}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground ml-1">Date de Naissance</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input 
                  type="date" 
                  name="dateNaissance"
                  value={formData.dateNaissance}
                  onChange={handleChange}
                  required
                  className={`w-full pl-12 pr-5 py-3.5 rounded-2xl bg-muted/30 border ${errors.date_naissance ? 'border-rose-500' : 'border-border/50'} focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium`}
                />
              </div>
              {errors.date_naissance && <p className="text-xs text-rose-500 mt-1">{errors.date_naissance[0]}</p>}
            </div>
          </div>
        </div>

        {/* Academic Information */}
        <div className="glass border border-border/50 rounded-[2.5rem] p-8 shadow-sm space-y-8">
          <h3 className="text-xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <Shield className="w-5 h-5" />
            </div>
            Informations Académiques
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground ml-1">Niveau</label>
              <select 
                name="niveau"
                value={formData.niveau}
                onChange={handleChange}
                className="w-full px-5 py-3.5 rounded-2xl bg-muted/30 border border-border/50 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium appearance-none"
              >
                <option value="Primaire">Primaire</option>
                <option value="Collège">Collège</option>
                <option value="Lycée">Lycée</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground ml-1">Classe</label>
              <select 
                name="classe"
                value={formData.classe}
                onChange={handleChange}
                required
                className={`w-full px-5 py-3.5 rounded-2xl bg-muted/30 border ${errors.classe_id ? 'border-rose-500' : 'border-border/50'} focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium appearance-none`}
              >
                <option value="">Sélectionnez une classe</option>
                {Array.isArray(classes) && classes.map(c => (
                  <option key={c.id} value={c.id}>{c.nom || c.name}</option>
                ))}
              </select>
              {errors.classe_id && <p className="text-xs text-rose-500 mt-1">{errors.classe_id[0]}</p>}
            </div>
          </div>
        </div>

        {/* Family Information */}
        <div className="glass border border-border/50 rounded-[2.5rem] p-8 shadow-sm space-y-8">
          <h3 className="text-xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Phone className="w-5 h-5" />
            </div>
            Contact & Parent
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground ml-1">Nom Complet du Parent</label>
              <input 
                type="text" 
                name="parentNom"
                value={formData.parentNom}
                onChange={handleChange}
                required
                className="w-full px-5 py-3.5 rounded-2xl bg-muted/30 border border-border/50 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
                placeholder="Ex: Ahmed Amrani"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground ml-1">Téléphone du Parent</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input 
                  type="tel" 
                  name="parentTelephone"
                  value={formData.parentTelephone}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-5 py-3.5 rounded-2xl bg-muted/30 border border-border/50 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
                  placeholder="06XXXXXXXX"
                />
              </div>
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-bold text-muted-foreground ml-1">Adresse</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-4 w-5 h-5 text-muted-foreground" />
                <textarea 
                  name="adresse"
                  value={formData.adresse}
                  onChange={handleChange}
                  required
                  rows="3"
                  className="w-full pl-12 pr-5 py-3.5 rounded-2xl bg-muted/30 border border-border/50 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium resize-none"
                  placeholder="Ex: Hay Riad, Rabat"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions Buttons */}
        <div className="flex items-center justify-end gap-4 pb-12">
          <button 
            type="button"
            onClick={onCancel}
            className="px-8 py-4 rounded-2xl border border-border hover:bg-muted transition-all font-bold"
          >
            Annuler
          </button>
          <button 
            type="submit"
            className="px-12 py-4 rounded-2xl bg-primary text-primary-foreground hover:opacity-90 transition-all font-black shadow-2xl shadow-primary/20 flex items-center gap-3"
          >
            <Save className="w-5 h-5" />
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
}

// Internal Info component for headers
function Info({ className }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
    </svg>
  );
}

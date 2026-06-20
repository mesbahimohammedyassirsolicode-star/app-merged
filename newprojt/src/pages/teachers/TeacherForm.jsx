import { useState } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Upload, 
  User, 
  BookOpen, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  CreditCard,
  Plus,
  Lock
} from 'lucide-react';
import { cn } from '../../lib/utils';

export default function TeacherForm({ teacher, onSave, onCancel, isLoading, apiError }) {
  const [formData, setFormData] = useState(teacher || {
    nom: '',
    prenom: '',
    cin: '',
    matiere: '',
    telephone: '',
    email: '',
    adresse: '',
    dateRecrutement: '',
    dateNaissance: '',
    classes: [],
    statut: 'Actif',
    photo: 'https://i.pravatar.cc/150?u=new',
    password: ''
  });

  const errors = apiError?.response?.data?.errors || {};

  const matieres = ["Maths", "Français", "Arabe", "Sciences", "Histoire", "Anglais", "Physique", "Informatique"];
  const availableClasses = ["TC Scientifique", "TC Lettres", "1ère BAC SE", "1ère BAC PC", "2ème BAC SM-A", "2ème BAC SM-B", "2ème BAC PC", "2ème BAC Eco"];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleClassToggle = (cls) => {
    setFormData(prev => {
      const classes = prev.classes.includes(cls)
        ? prev.classes.filter(c => c !== cls)
        : [...prev.classes, cls];
      return { ...prev, classes };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onCancel}
            className="p-3 rounded-2xl bg-card border border-border hover:bg-accent hover:text-foreground transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {teacher ? 'Modifier l\'enseignant' : 'Ajouter un enseignant'}
            </h1>
            <p className="text-muted-foreground mt-1">Remplissez les informations détaillées ci-dessous.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={onCancel}
            className="px-6 py-2.5 rounded-2xl border border-border font-semibold hover:bg-accent transition-all text-foreground"
          >
            Annuler
          </button>
          <button 
            onClick={handleSubmit}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-primary text-primary-foreground hover:opacity-90 transition-all shadow-lg shadow-primary/20 font-semibold"
          >
            <Save className="w-5 h-5" />
            Enregistrer
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Photo & Main Info */}
        <div className="lg:col-span-1 space-y-8">
          <div className="glass border border-border/50 rounded-[2.5rem] p-8 text-center space-y-6 bg-card/30 backdrop-blur-md">
            <div className="relative group mx-auto w-40 h-40">
              <div className="absolute -inset-1 bg-gradient-to-br from-primary to-blue-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
              <div className="relative w-40 h-40 rounded-[2.5rem] bg-card border-2 border-border overflow-hidden transform group-hover:scale-[1.02] transition-transform duration-500 shadow-xl">
                <img src={formData.photo} alt="Avatar" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                  <Upload className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
            <div>
              <p className="font-bold text-lg text-foreground">Photo de profil</p>
              <p className="text-sm text-muted-foreground mt-1">JPG, PNG ou WebP. Max 2MB.</p>
            </div>
          </div>

          <div className="glass border border-border/50 rounded-[2.5rem] p-8 space-y-6 bg-card/30 backdrop-blur-md">
            <h3 className="text-xl font-bold flex items-center gap-3 text-foreground">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <BookOpen className="w-5 h-5" />
              </div>
              Affectation
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Matière principale</label>
                <select 
                  name="matiere"
                  value={formData.matiere}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-2xl bg-muted/30 border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
                >
                  <option value="">Sélectionner une matière</option>
                  {matieres.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                {errors.matiere && <p className="text-xs text-rose-500 mt-1">{errors.matiere[0]}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Statut</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-muted/30 rounded-2xl border border-border/50">
                  {['Actif', 'Inactif'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, statut: s }))}
                      className={cn(
                        "py-2 rounded-xl text-sm font-bold transition-all",
                        formData.statut === s 
                          ? "bg-card text-foreground shadow-sm" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Info */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass border border-border/50 rounded-[2.5rem] p-8 space-y-8 bg-card/30 backdrop-blur-md">
            <h3 className="text-xl font-bold flex items-center gap-3 text-foreground">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <User className="w-5 h-5" />
              </div>
              Informations Personnelles
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Prénom" name="prenom" value={formData.prenom} onChange={handleChange} icon={User} placeholder="Ex: Mohamed" error={errors.prenom} />
              <FormField label="Nom" name="nom" value={formData.nom} onChange={handleChange} icon={User} placeholder="Ex: Amrani" error={errors.nom} />
              <FormField label="Email" name="email" value={formData.email} onChange={handleChange} icon={Mail} placeholder="mohamed.amrani@eduflow.ma" error={errors.email} />
              {!teacher && (
                <FormField label="Mot de passe" name="password" type="password" value={formData.password} onChange={handleChange} icon={Lock} placeholder="Min 8 caractères" error={errors.password} />
              )}
              <FormField label="CIN" name="cin" value={formData.cin} onChange={handleChange} icon={CreditCard} placeholder="Ex: BJ123456" error={errors.cin} />
              <FormField label="Date de Naissance" name="dateNaissance" value={formData.dateNaissance} onChange={handleChange} icon={Calendar} type="date" error={errors.dateNaissance} />
              <FormField label="Téléphone" name="telephone" value={formData.telephone} onChange={handleChange} icon={Phone} placeholder="06XXXXXXXX" error={errors.telephone} />
              <div className="md:col-span-2">
                <FormField label="Adresse" name="adresse" value={formData.adresse} onChange={handleChange} icon={MapPin} placeholder="Quartier, Ville" error={errors.adresse} />
              </div>
              <FormField label="Date de Recrutement" name="dateRecrutement" value={formData.dateRecrutement} onChange={handleChange} icon={Calendar} type="date" error={errors.dateRecrutement} />
            </div>

            <div className="space-y-4">
              <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" />
                Classes Assignées
              </label>
              <div className="flex flex-wrap gap-2">
                {availableClasses.map((cls) => (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => handleClassToggle(cls)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold border transition-all",
                      formData.classes.includes(cls)
                        ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                        : "bg-card text-muted-foreground border-border hover:border-primary/50"
                    )}
                  >
                    {cls}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

function FormField({ label, icon: Icon, error, ...props }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{label}</label>
      <div className="relative group">
        <Icon className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${error ? 'text-rose-500' : 'text-muted-foreground group-focus-within:text-primary'} transition-colors`} />
        <input 
          {...props}
          className={`w-full pl-12 pr-4 py-3 rounded-2xl bg-muted/30 border ${error ? 'border-rose-500' : 'border-border/50'} focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground/50`}
        />
      </div>
      {error && <p className="text-xs text-rose-500 mt-1">{error[0]}</p>}
    </div>
  );
}

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const fr = {
  common: {
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    edit: 'Modifier',
    add: 'Ajouter',
    search: 'Rechercher',
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
  },
  auth: {
    login: 'Connexion',
    logout: 'Déconnexion',
    email: 'Email',
    password: 'Mot de passe',
    loginSuccess: 'Connexion réussie',
    loginError: 'Identifiants incorrects.',
  },
  nav: {
    dashboard: 'Tableau de bord',
    users: 'Utilisateurs',
    academic: 'Structure académique',
    years: 'Années scolaires',
    levels: 'Niveaux',
    filieres: 'Filières',
    groups: 'Groupes',
    modules: 'Modules',
    affectations: 'Affectations',
    attendance: 'Présences',
    seances: 'Séances',
    evaluations: 'Évaluations',
    grades: 'Notes',
    stages: 'Stages',
    feedback: 'Avis',
    notifications: 'Notifications',
    parentChildren: 'Mes enfants',
  },
  app: {
    title: 'GIMS',
    subtitle: 'Système de Gestion IKI',
  },
};

i18n.use(initReactI18next).init({
  resources: { fr: { translation: fr } },
  lng: 'fr',
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
});

export default i18n;

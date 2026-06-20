import api from '../lib/api';

function normalizeClasse(raw) {
  if (!raw || typeof raw !== 'object') return raw;
  return {
    ...raw,
    nom: raw.nom || raw.name || '',
    niveauNom: raw.niveau?.nom || raw.niveau?.name || '',
    enseignant: raw.enseignant_principal ? `${raw.enseignant_principal.prenom} ${raw.enseignant_principal.nom}` : 'Non assigné',
    studentsCount: raw.eleves_count || 0,
    capacite: raw.capacite_max || 30,
    statut: raw.statut || 'Actif'
  };
}

const classeService = {
  getAll: (params) => api.get('/classes', { params }).then(res => res.data.map(normalizeClasse)),
  getById: (id) => api.get(`/classes/${id}`).then(res => normalizeClasse(res.data)),
  create: (data) => api.post('/classes', data).then(res => normalizeClasse(res.data)),
  update: (id, data) => api.put(`/classes/${id}`, data).then(res => normalizeClasse(res.data)),
  remove: (id) => api.delete(`/classes/${id}`).then(res => res.data),
};

export default classeService;

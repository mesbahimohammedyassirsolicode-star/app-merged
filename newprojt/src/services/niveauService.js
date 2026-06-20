import api from '../lib/api';

function normalizeNiveau(raw) {
  if (!raw || typeof raw !== 'object') return raw;
  return {
    ...raw,
    nom: raw.nom || raw.name || '',
    classesCount: raw.classes_count || 0,
    studentsCount: raw.eleves_count || 0,
  };
}

const niveauService = {
  getAll: () => api.get('/niveaux').then(res => res.data.map(normalizeNiveau)),
  create: (data) => api.post('/niveaux', data).then(res => normalizeNiveau(res.data)),
  update: (id, data) => api.put(`/niveaux/${id}`, data).then(res => normalizeNiveau(res.data)),
  remove: (id) => api.delete(`/niveaux/${id}`).then(res => res.data),
};

export default niveauService;

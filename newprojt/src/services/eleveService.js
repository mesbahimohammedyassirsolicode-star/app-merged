import api from '../lib/api';

/** Map API (snake_case + nested classe) to fields used by list/detail UI */
function normalizeEleve(raw) {
  if (!raw || typeof raw !== 'object') return raw;
  const classe = raw.classe;
  const niveauNom =
    (typeof raw.niveau === 'string' && raw.niveau) ||
    classe?.niveau?.nom ||
    '';
  const classeNom =
    (typeof raw.classe === 'string' && raw.classe) ||
    classe?.nom ||
    '';

  return {
    ...raw,
    codeMassar: raw.codeMassar ?? raw.code_massar ?? '',
    dateNaissance: raw.dateNaissance ?? raw.date_naissance ?? '',
    niveau: niveauNom,
    classe: classeNom,
  };
}

function extractRows(res) {
  const d = res.data;
  if (Array.isArray(d)) return d;
  if (d && Array.isArray(d.data)) return d.data;
  return [];
}

const eleveService = {
  getAll: (params) =>
    api.get('/eleves', { params }).then((res) => extractRows(res).map(normalizeEleve)),

  getById: (id) =>
    api.get(`/eleves/${id}`).then((res) => normalizeEleve(res.data)),

  create: (data) =>
    api.post('/eleves', data).then((res) => normalizeEleve(res.data)),

  update: (id, data) =>
    api.put(`/eleves/${id}`, data).then((res) => normalizeEleve(res.data)),

  remove: (id) => api.delete(`/eleves/${id}`).then((res) => res.data),
};

export default eleveService;

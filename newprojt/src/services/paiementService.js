import api from '../lib/api';

function extractRows(res) {
  const d = res.data;
  if (Array.isArray(d)) return d;
  if (d && Array.isArray(d.data)) return d.data;
  return [];
}

const paiementService = {
  getAll: (params) =>
    api.get('/paiements', { params }).then((res) => extractRows(res)),

  getImpayes: () => api.get('/paiements/impayes').then((res) => res.data),

  create: (data) => api.post('/paiements', data).then((res) => res.data),

  update: (id, data) =>
    api.put(`/paiements/${id}`, data).then((res) => res.data),

  getRecu: (id) =>
    api.get(`/paiements/${id}/recu`, { responseType: 'blob' }).then((res) => res.data),
};

export default paiementService;

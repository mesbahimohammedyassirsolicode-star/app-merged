import api from '../lib/api';

function extractRows(res) {
  const d = res.data;
  if (Array.isArray(d)) return d;
  if (d && Array.isArray(d.data)) return d.data;
  return [];
}

const absenceService = {
  getAll: (params) =>
    api.get('/absences', { params }).then((res) => extractRows(res)),

  getStats: () => api.get('/absences/stats').then((res) => res.data),

  create: (data) => api.post('/absences', data).then((res) => res.data),

  justifier: (id) =>
    api.put(`/absences/${id}/justifier`).then((res) => res.data),

  getRapport: () =>
    api.get('/absences/rapport', { responseType: 'blob' }).then((res) => res.data),
};

export default absenceService;

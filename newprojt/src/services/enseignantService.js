import api from '../lib/api';

function extractRows(res) {
  const d = res.data;
  if (Array.isArray(d)) return d;
  if (d && Array.isArray(d.data)) return d.data;
  return [];
}

const enseignantService = {
  getAll: (params) =>
    api.get('/enseignants', { params }).then((res) => extractRows(res)),

  getById: (id) => api.get(`/enseignants/${id}`).then((res) => res.data),

  create: (data) => api.post('/enseignants', data).then((res) => res.data),

  update: (id, data) =>
    api.put(`/enseignants/${id}`, data).then((res) => res.data),

  remove: (id) => api.delete(`/enseignants/${id}`).then((res) => res.data),
};

export default enseignantService;

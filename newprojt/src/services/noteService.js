import api from '../lib/api';

function extractRows(res) {
  const d = res.data;
  if (Array.isArray(d)) return d;
  if (d && Array.isArray(d.data)) return d.data;
  return [];
}

const noteService = {
  getAll: (params) =>
    api.get('/notes', { params }).then((res) => extractRows(res)),

  saveBulk: (data) =>
    api.post('/notes/bulk', data).then((res) => res.data),

  getBulletin: (eleveId, trimestre) =>
    api
      .get(`/notes/bulletin/${eleveId}/${trimestre}`)
      .then((res) => res.data),
};

export default noteService;

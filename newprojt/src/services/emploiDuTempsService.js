import api from '../lib/api';

const emploiDuTempsService = {
  getAll: (params) =>
    api.get('/emploi-du-temps', { params }).then((res) => res.data),

  create: (data) =>
    api.post('/emploi-du-temps', data).then((res) => res.data),

  update: (id, data) =>
    api.put(`/emploi-du-temps/${id}`, data).then((res) => res.data),

  remove: (id) =>
    api.delete(`/emploi-du-temps/${id}`).then((res) => res.data),
};

export default emploiDuTempsService;

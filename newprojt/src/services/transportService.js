import api from '../lib/api';

const transportService = {
  getBus: () => api.get('/bus').then((res) => res.data),

  getBusById: (id) => api.get(`/bus/${id}`).then((res) => res.data),

  createBus: (data) => api.post('/bus', data).then((res) => res.data),

  getEleves: () => api.get('/transport/eleves').then((res) => res.data),

  reportIncident: (data) =>
    api.post('/transport/incidents', data).then((res) => res.data),

  getIncidents: () =>
    api.get('/transport/incidents').then((res) => res.data),
};

export default transportService;

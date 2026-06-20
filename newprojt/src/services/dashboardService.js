import api from '../lib/api';

/** Map dashboard stats API keys to camelCase used by Dashboard.jsx */
function mapStats(d) {
  if (!d || typeof d !== 'object') return d;
  return {
    totalEleves: String(d.total_eleves ?? 0),
    presenceToday: String(d.presence_today ?? 0),
    revenusMois: String(d.revenus_mois ?? 0),
    totalAlertes: String(d.alertes_count ?? 0),
    totalEnseignants: String(d.total_enseignants ?? 0),
    totalClasses: String(d.classes_actives ?? 0),
    totalImpayes: String(d.impayes_count ?? 0),
    nouveauxInscrits: String(d.nouveaux_inscrits ?? 0),
  };
}

const dashboardService = {
  getStats: () =>
    api.get('/dashboard/stats').then((res) => mapStats(res.data)),

  getPresenceTrend: () =>
    api.get('/dashboard/presence-trend').then((res) => res.data),

  getElevesParNiveau: () =>
    api.get('/dashboard/eleves-par-niveau').then((res) => res.data),

  getAlertesRecentes: () =>
    api.get('/dashboard/alertes-recentes').then((res) => res.data),
};

export default dashboardService;

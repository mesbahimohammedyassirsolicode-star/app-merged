export const mockTransportStats = [
  { label: 'Total élèves transportés', value: '142', icon: 'Users', color: 'text-blue-500' },
  { label: 'Nombre de bus', value: '8', icon: 'Bus', color: 'text-emerald-500' },
  { label: 'Nombre de chauffeurs', value: '10', icon: 'UserSquare2', color: 'text-indigo-500' },
  { label: 'Incidents ce mois', value: '2', icon: 'AlertTriangle', color: 'text-amber-500' },
];

export const mockTransportStudents = [
  { id: 1, nom: 'Benjelloun Amine', classe: '1A', zone: 'Hay Salam', bus: 'Bus #04', chauffeur: 'Ahmed', matin: '07:15', soir: '16:45', statut: 'Actif' },
  { id: 2, nom: 'El Amrani Sara', classe: '2B', zone: 'Mesnana', bus: 'Bus #02', chauffeur: 'Driss', matin: '07:30', soir: '16:30', statut: 'Actif' },
  { id: 3, nom: 'Tahiri Yassine', classe: '3A', zone: 'Beni Makada', bus: 'Bus #01', chauffeur: 'Said', matin: '07:00', soir: '17:00', statut: 'Suspendu' },
  { id: 4, nom: 'Berrada Sofia', classe: '1B', zone: 'Malabata', bus: 'Bus #07', chauffeur: 'Khalid', matin: '07:45', soir: '16:15', statut: 'Actif' },
  { id: 5, nom: 'Alaoui Mehdi', classe: '4A', zone: 'Iberia', bus: 'Bus #03', chauffeur: 'Omar', matin: '07:20', soir: '16:40', statut: 'Actif' },
  { id: 6, nom: 'Mansouri Laila', classe: '5C', zone: 'Hay Salam', bus: 'Bus #04', chauffeur: 'Ahmed', matin: '07:18', soir: '16:48', statut: 'Actif' },
  { id: 7, nom: 'Chraibi Omar', classe: '2A', zone: 'Mesnana', bus: 'Bus #02', chauffeur: 'Driss', matin: '07:35', soir: '16:35', statut: 'Actif' },
  { id: 8, nom: 'Bennani Meryem', classe: '1A', zone: 'Mghogha', bus: 'Bus #05', chauffeur: 'Youssef', matin: '07:10', soir: '16:50', statut: 'Actif' },
  { id: 9, nom: 'Touhami Khalid', classe: '3B', zone: 'Beni Makada', bus: 'Bus #01', chauffeur: 'Said', matin: '07:05', soir: '17:05', statut: 'Actif' },
  { id: 10, nom: 'Filali Zineb', classe: '2B', zone: 'Malabata', bus: 'Bus #07', chauffeur: 'Khalid', matin: '07:50', soir: '16:10', statut: 'Actif' },
];

export const mockBuses = [
  { id: 1, numero: 'Bus #01', chauffeur: 'Said', capacite: 30, assignes: 24, zone: 'Beni Makada', statut: 'En service', modele: 'Mercedes Sprinter', plaque: '12345-A-1' },
  { id: 2, numero: 'Bus #02', chauffeur: 'Driss', capacite: 25, assignes: 21, zone: 'Mesnana', statut: 'En service', modele: 'Iveco Daily', plaque: '67890-B-1' },
  { id: 3, numero: 'Bus #03', chauffeur: 'Omar', capacite: 30, assignes: 28, zone: 'Iberia', statut: 'Maintenance', modele: 'Mercedes Sprinter', plaque: '11223-C-1' },
  { id: 4, numero: 'Bus #04', chauffeur: 'Ahmed', capacite: 25, assignes: 23, zone: 'Hay Salam', statut: 'En service', modele: 'Iveco Daily', plaque: '44556-D-1' },
];

export const mockTransportIncidents = [
  { id: 1, date: '2026-05-10', bus: 'Bus #02', chauffeur: 'Driss', type: 'Panne mécanique', eleves: '21 concernés', statut: 'Résolu' },
  { id: 2, date: '2026-05-11', bus: 'Bus #01', chauffeur: 'Said', type: 'Retard trafic', eleves: '5 concernés', statut: 'Ouvert' },
];

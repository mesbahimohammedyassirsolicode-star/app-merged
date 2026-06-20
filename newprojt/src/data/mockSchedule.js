export const SUBJECTS = [
  { id: 'maths', label: 'Mathématiques', color: 'bg-blue-500/20 text-blue-400 border-blue-500/50', icon: '📐' },
  { id: 'francais', label: 'Français', color: 'bg-purple-500/20 text-purple-400 border-purple-500/50', icon: '📚' },
  { id: 'arabe', label: 'Arabe', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50', icon: '🕌' },
  { id: 'sciences', label: 'Sciences SVT', color: 'bg-orange-500/20 text-orange-400 border-orange-500/50', icon: '🧪' },
  { id: 'anglais', label: 'Anglais', color: 'bg-pink-500/20 text-pink-400 border-pink-500/50', icon: '🌍' },
  { id: 'sport', label: 'EPS', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50', icon: '⚽' },
  { id: 'histoire', label: 'Histoire-Géo', color: 'bg-amber-500/20 text-amber-400 border-amber-500/50', icon: '🗺️' },
  { id: 'physique', label: 'Physique-Chimie', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50', icon: '⚡' },
];

export const TEACHERS = [
  { id: 't1', name: 'Mohammed Alami', subject: 'maths' },
  { id: 't2', name: 'Khadija Bennani', subject: 'francais' },
  { id: 't3', name: 'Youssef Mansouri', subject: 'arabe' },
  { id: 't4', name: 'Siham Tazi', subject: 'sciences' },
  { id: 't5', name: 'Ahmed Amrani', subject: 'anglais' },
  { id: 't6', name: 'Zineb Idrissi', subject: 'histoire' },
];

export const CLASSES = [
  { id: '1a', label: 'Classe 1A' },
  { id: '1b', label: 'Classe 1B' },
  { id: '2a', label: 'Classe 2A' },
  { id: '2b', label: 'Classe 2B' },
  { id: '3a', label: 'Classe 3A' },
];

export const ROOMS = [
  { id: 'r1', label: 'Salle 101' },
  { id: 'r2', label: 'Salle 102' },
  { id: 'r3', label: 'Salle 103' },
  { id: 'r4', label: 'Labo Sciences' },
  { id: 'r5', label: 'Terrain Sport' },
  { id: 'r6', label: 'Salle Informatique' },
];

export const DAYS = [
  'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'
];

export const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'
];

export const MOCK_SESSIONS = [
  // Lundi
  { id: 1, classId: '1a', teacherId: 't1', subjectId: 'maths', day: 'Lundi', startTime: '08:00', endTime: '10:00', roomId: 'r1' },
  { id: 2, classId: '1a', teacherId: 't2', subjectId: 'francais', day: 'Lundi', startTime: '10:00', endTime: '12:00', roomId: 'r2' },
  { id: 3, classId: '1a', teacherId: 't4', subjectId: 'sciences', day: 'Lundi', startTime: '14:00', endTime: '16:00', roomId: 'r4' },
  
  // Mardi
  { id: 4, classId: '1a', teacherId: 't3', subjectId: 'arabe', day: 'Mardi', startTime: '08:00', endTime: '10:00', roomId: 'r3' },
  { id: 5, classId: '1a', teacherId: 't5', subjectId: 'anglais', day: 'Mardi', startTime: '10:00', endTime: '11:00', roomId: 'r1' },
  { id: 6, classId: '1a', teacherId: 't1', subjectId: 'maths', day: 'Mardi', startTime: '11:00', endTime: '12:00', roomId: 'r2' },
  { id: 7, classId: '1a', teacherId: 't6', subjectId: 'histoire', day: 'Mardi', startTime: '14:00', endTime: '15:00', roomId: 'r3' },
  
  // Mercredi
  { id: 8, classId: '1a', teacherId: 't2', subjectId: 'francais', day: 'Mercredi', startTime: '08:00', endTime: '10:00', roomId: 'r2' },
  { id: 9, classId: '1a', teacherId: 't5', subjectId: 'sport', day: 'Mercredi', startTime: '10:00', endTime: '12:00', roomId: 'r5' },
];

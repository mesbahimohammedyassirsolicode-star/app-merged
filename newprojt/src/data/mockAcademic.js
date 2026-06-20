export const mockLevels = [
  { id: 1, nom: '1ère Année Primaire', classesCount: 2, studentsCount: 45, description: 'Premier niveau du cycle primaire.' },
  { id: 2, nom: '2ème Année Primaire', classesCount: 2, studentsCount: 42, description: 'Deuxième niveau du cycle primaire.' },
  { id: 3, nom: '3ème Année Primaire', classesCount: 2, studentsCount: 48, description: 'Troisième niveau du cycle primaire.' },
  { id: 4, nom: '4ème Année Primaire', classesCount: 2, studentsCount: 50, description: 'Quatrième niveau du cycle primaire.' },
  { id: 5, nom: '5ème Année Primaire', classesCount: 2, studentsCount: 44, description: 'Cinquième niveau du cycle primaire.' },
];

export const mockClasses = [
  { id: 1, nom: '1A', niveauId: 1, niveauNom: '1ère Année Primaire', enseignant: 'Ahmed Alami', studentsCount: 22, capacite: 30, statut: 'Actif' },
  { id: 2, nom: '1B', niveauId: 1, niveauNom: '1ère Année Primaire', enseignant: 'Sanaa Benali', studentsCount: 23, capacite: 30, statut: 'Actif' },
  { id: 3, nom: '2A', niveauId: 2, niveauNom: '2ème Année Primaire', enseignant: 'Youssef Tazi', studentsCount: 21, capacite: 25, statut: 'Actif' },
  { id: 4, nom: '2B', niveauId: 2, niveauNom: '2ème Année Primaire', enseignant: 'Laila Mansouri', studentsCount: 21, capacite: 25, statut: 'Plein' },
  { id: 5, nom: '3A', niveauId: 3, niveauNom: '3ème Année Primaire', enseignant: 'Karim Idrissi', studentsCount: 24, capacite: 30, statut: 'Actif' },
  { id: 6, nom: '3B', niveauId: 3, niveauNom: '3ème Année Primaire', enseignant: 'Fatima Zahra', studentsCount: 24, capacite: 30, statut: 'Actif' },
  { id: 7, nom: '4A', niveauId: 4, niveauNom: '4ème Année Primaire', enseignant: 'Omar Chraibi', studentsCount: 25, capacite: 30, statut: 'Actif' },
  { id: 8, nom: '4B', niveauId: 4, niveauNom: '4ème Année Primaire', enseignant: 'Meryem Bennani', studentsCount: 25, capacite: 30, statut: 'Actif' },
  { id: 9, nom: '5A', niveauId: 5, niveauNom: '5ème Année Primaire', enseignant: 'Khalid Touhami', studentsCount: 22, capacite: 25, statut: 'Actif' },
  { id: 10, nom: '5B', niveauId: 5, niveauNom: '5ème Année Primaire', enseignant: 'Zineb Filali', studentsCount: 22, capacite: 25, statut: 'Actif' },
];

export const mockClassStudents = {
  1: [
    { id: 1, nom: 'Benjelloun', prenom: 'Amine', codeMassar: 'R134567890' },
    { id: 2, nom: 'El Amrani', prenom: 'Sara', codeMassar: 'S134567891' },
    { id: 3, nom: 'Tahiri', prenom: 'Yassine', codeMassar: 'T134567892' },
    { id: 4, nom: 'Berrada', prenom: 'Sofia', codeMassar: 'B134567893' },
    { id: 5, nom: 'Alaoui', prenom: 'Mehdi', codeMassar: 'A134567894' },
  ],
  // Reuse or generate more if needed, but for mock 1 is enough to show
};

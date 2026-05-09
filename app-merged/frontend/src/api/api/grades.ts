import api from '../../lib/axios';
import { unwrapData, type ApiResponse } from '../../lib/api';

export interface GradeRow {
  stagiaire_id: number;
  student_name: string;
  grade: number | null;
  status: 'Passed' | 'Failed';
}

export interface TrainerGradeEntryStudent {
  id: number;
  name: string;
  existing_grade: number | null;
}

export interface TrainerGradeEntryModule {
  module_id: number;
  module_name: string;
  students: TrainerGradeEntryStudent[];
}

export interface TrainerGradeEntryGroup {
  group_id: number;
  group_name: string;
  modules: TrainerGradeEntryModule[];
}

export interface TrainerGradeEntryFiliere {
  filiere_id: number;
  filiere_name: string;
  groups: TrainerGradeEntryGroup[];
}

export interface TrainerGradeEntryItem {
  module_id: number;
  student_id: number;
  grade: number;
}

export const gradesApi = {
  list: (params: { module_id: number; groupe_id: number }) =>
    api.get<ApiResponse<GradeRow[]>>('/grades', { params }).then(unwrapData),
  save: (payload: { module_id: number; groupe_id: number; stagiaire_id: number; valeur: number }) =>
    api.post<ApiResponse<{ note_id: number }>>('/grades', payload).then(unwrapData),
  trainerGradeEntryData: () =>
    api.get<ApiResponse<TrainerGradeEntryFiliere[]>>('/trainer/grade-entry-data').then(unwrapData),
  saveTrainerGrades: (entries: TrainerGradeEntryItem[]) =>
    api.post<ApiResponse<Array<{ student_id: number; module_id: number; note_id: number; grade: number }>>>('/trainer/grades', { entries }).then(unwrapData),
};

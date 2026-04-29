import api from '../../lib/axios';
import { unwrapData, type ApiResponse } from '../../lib/api';

export interface AnneeScolaire {
  id: number;
  year_start: number;
  year_end: number;
  label: string;
  is_current: boolean;
  start_date: string;
  end_date: string;
}

export interface Niveau {
  id: number;
  label: string;
  code: string;
}

export interface Filiere {
  id: number;
  niveau_id: number;
  label: string;
  code: string;
  description?: string;
  niveau?: Niveau;
  modules?: {
    id: number;
    filiere_id: number;
    niveau_id?: number;
    code: string;
    label: string;
    name?: string;
    semester?: string;
  }[];
  groups?: {
    id: number;
    filiere_id: number;
    name: string;
    label: string;
    year_level?: number;
    capacity?: number;
    /** Present when API includes enrollment counts. */
    students_count?: number;
    /** Present for teacher/formateur scoped groups list. */
    stagiaires?: { id: number; user?: { id: number; name: string } | null }[];
  }[];
}

export interface ProgramModule {
  id: number;
  niveau_id: number;
  code: string;
  label: string;
  semester?: string;
}

export interface ProgramGroup {
  id: number;
  niveau_id: number;
  label: string;
  year_level?: number;
}

export interface ProgramResponse {
  modules: ProgramModule[];
  groups: ProgramGroup[];
}

export const academicStructureApi = {
  getYears: () => api.get<ApiResponse<AnneeScolaire[]>>('/academic-structure/years').then(unwrapData),
  createYear: (body: Partial<AnneeScolaire>) =>
    api.post<ApiResponse<AnneeScolaire>>('/academic-structure/years', body).then(unwrapData),
  updateYear: (id: number, body: Partial<AnneeScolaire>) =>
    api.put<ApiResponse<AnneeScolaire>>(`/academic-structure/years/${id}`, body).then(unwrapData),
  deleteYear: (id: number) => api.delete(`/academic-structure/years/${id}`),
  getLevels: () => api.get<ApiResponse<Niveau[]>>('/academic-structure/levels').then(unwrapData),
  /** Admin-only — full list with module/group relations. */
  getFilieres: (niveauId?: number) =>
    api
      .get<ApiResponse<Filiere[]>>('/academic-structure/filieres', { params: niveauId ? { niveau_id: niveauId } : {} })
      .then(unwrapData),
  /** All authenticated roles — lightweight filière list for filters/dropdowns. */
  listFilieres: (niveauId?: number) =>
    api
      .get<ApiResponse<Filiere[]>>('/filieres', { params: niveauId ? { niveau_id: niveauId } : {} })
      .then(unwrapData),
  createFiliere: (body: { niveau_id: number; label: string; code: string; description?: string }) =>
    api.post<ApiResponse<Filiere>>('/academic-structure/filieres', body).then(unwrapData),
  updateFiliere: (id: number, body: Partial<Filiere>) =>
    api.put<ApiResponse<Filiere>>(`/academic-structure/filieres/${id}`, body).then(unwrapData),
  deleteFiliere: (id: number) => api.delete(`/academic-structure/filieres/${id}`),
  getProgram: (params: { filiere_id: number; niveau: string }) =>
    api.get<ApiResponse<ProgramResponse>>('/program', { params }).then(unwrapData),
};

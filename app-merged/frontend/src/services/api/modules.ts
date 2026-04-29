import api from '../../lib/axios';
import { unwrapData, type ApiResponse } from '../../lib/api';

export interface SyllabusItem {
  id: number;
  module_id: number;
  label: string;
  estimated_hours: number;
  order: number;
}

export interface Module {
  id: number;
  filiere_id: number;
  code: string;
  label: string;
  masse_horaire: number;
  coefficient: number;
  semester: string;
  niveau?: string;
  filiere?: { id: number; label: string };
  syllabusItems?: SyllabusItem[];
}

export interface AcademicCatalogFiliere {
  id: number;
  code: string;
  label: string;
  type: string;
  required_level: string;
  duration_years: number;
  modules: Module[];
}

export const modulesApi = {
  list: (params?: { filiere_id?: number }) =>
    api.get<ApiResponse<Module[]>>('/modules', { params }).then(unwrapData),
  academicCatalog: () =>
    api.get<ApiResponse<AcademicCatalogFiliere[]>>('/modules/academic-catalog').then(unwrapData),
  get: (id: number) => api.get<ApiResponse<Module>>(`/modules/${id}`).then(unwrapData),
  getSyllabus: (id: number) =>
    api.get<ApiResponse<SyllabusItem[]>>(`/modules/${id}/syllabus`).then(unwrapData),
  create: (body: { filiere_id: number; code: string; label: string; masse_horaire: number; coefficient: number; semester: string }) =>
    api.post<ApiResponse<Module>>('/modules', body).then(unwrapData),
  update: (id: number, body: Partial<Module>) =>
    api.put<ApiResponse<Module>>(`/modules/${id}`, body).then(unwrapData),
  delete: (id: number) => api.delete(`/modules/${id}`),
  updateSyllabus: (id: number, items: { label: string; estimated_hours: number; order: number }[]) =>
    api.post<ApiResponse<unknown>>(`/modules/${id}/syllabus`, { items }).then(unwrapData),
};

import api from '../../lib/axios';
import { unwrapData, type ApiResponse } from '../../lib/api';

export interface TeacherAssignmentModule {
  id: number;
  code: string;
  label: string;
  groupes: { id: number; label: string; filiere?: { id: number; code: string; label: string } | null }[];
}

export interface TeacherAssignmentsResponse {
  teacher_id: number;
  academic_year: number | null;
  modules: TeacherAssignmentModule[];
}

export const formateurAssignmentsApi = {
  save: (body: { teacher_id: number; academic_year: number; module_ids: number[] }) =>
    api.post<ApiResponse<{ message: string }>>('/formateur-assignments', body).then(unwrapData),

  byTeacher: (teacherId: number, academicYear?: number) =>
    api
      .get<ApiResponse<TeacherAssignmentsResponse>>(`/formateur-assignments/formateurs/${teacherId}`, {
        params: academicYear ? { academic_year: academicYear } : {},
      })
      .then(unwrapData),

  me: (params?: { academic_year?: number; date?: string }) =>
    api
      .get<ApiResponse<TeacherAssignmentsResponse>>('/formateur-assignments/me', {
        params: {
          ...(params?.academic_year ? { academic_year: params.academic_year } : {}),
          ...(params?.date ? { date: params.date } : {}),
        },
      })
      .then(unwrapData),
};


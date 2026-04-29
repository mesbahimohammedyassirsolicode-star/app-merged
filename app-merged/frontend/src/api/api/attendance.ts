import { AxiosError } from 'axios';
import api from '../../lib/axios';
import { unwrapData, type ApiResponse } from '../../lib/api';

export type AttendanceStatus = 'present' | 'absent' | 'late';

export interface AttendanceSessionRowInput {
  student_id: number;
  status: AttendanceStatus;
  minutes_late?: number;
  note?: string;
}

export interface AttendanceSessionPayload {
  group_id: number;
  module_id: number;
  date: string;
  academic_year: string;
  attendances: AttendanceSessionRowInput[];
}

export interface AttendanceSessionResponse {
  message: string;
  summary: {
    created: number;
    updated: number;
    total: number;
  };
}

export interface AttendanceRecord {
  id: number;
  stagiaire_id?: number | null;
  student_id: number;
  module_id: number;
  group_id: number;
  filiere_id?: number | null;
  teacher_id?: number | null;
  formateur_id?: number | null;
  date?: string | null;
  status: AttendanceStatus;
  minutes_late: number | null;
  note: string | null;
  academic_year?: string | null;
}

export interface AttendanceDetectParams {
  group_id: number;
  module_id: number;
  date: string;
  /** Optional; aligned with Laravel academic year window (Sep–Aug). */
  academic_year?: string;
}

export interface AttendanceReportParams {
  period?: 'daily' | 'weekly';
  date?: string;
  filiere_id?: number;
  group_id?: number;
  module_id?: number;
}

export interface AttendanceReportSummary {
  period: string;
  date_from: string;
  date_to: string;
  summary: {
    total: number;
    present: number;
    absent: number;
    late: number;
  };
}

export interface AttendanceIndexParams {
  module_id: number;
  group_id: number;
  date?: string;
  date_from?: string;
  date_to?: string;
  status?: AttendanceStatus;
  academic_year?: string;
  filiere_id?: number;
}

export const attendanceApi = {
  /** Preferred REST path — same payload as legacy `/attendance/sessions`. */
  markSession: (body: AttendanceSessionPayload) =>
    api.post<ApiResponse<AttendanceSessionResponse>>('/attendance', body).then(unwrapData),

  /** Legacy alias kept for older clients. */
  markSessionLegacy: (body: AttendanceSessionPayload) =>
    api.post<ApiResponse<AttendanceSessionResponse>>('/attendance/sessions', body).then(unwrapData),

  list: (params: AttendanceIndexParams) =>
    api.get<ApiResponse<AttendanceRecord[]>>('/attendance', { params }).then(unwrapData),

  report: (params?: AttendanceReportParams) =>
    api.get<ApiResponse<AttendanceReportSummary>>('/attendance/report', { params }).then(unwrapData),

  detectMarkedSession: async (params: AttendanceDetectParams): Promise<AttendanceRecord[] | null> => {
    try {
      return await api
        .get<ApiResponse<AttendanceRecord[]>>('/attendance/detect', {
          params: {
            group_id: params.group_id,
            module_id: params.module_id,
            date: params.date,
            ...(params.academic_year ? { academic_year: params.academic_year } : {}),
          },
        })
        .then(unwrapData);
    } catch (error) {
      const status = (error as AxiosError)?.response?.status;
      if (status === 403) {
        return null;
      }
      throw error;
    }
  },
};

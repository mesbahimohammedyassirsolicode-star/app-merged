import api from '../../lib/axios';
import { unwrapData, type ApiResponse } from '../../lib/api';

// ── Types ────────────────────────────────────────────────────────────────────

export interface TimetableSeance {
  id: number;
  scope?: 'global' | 'group';
  date: string;
  start_time: string;
  end_time: string;
  salle?: string;
  status: 'planifie' | 'realise' | 'annule' | string;
  type?: 'presentiel' | 'distance' | string;
  user_id?: number;
  module_id?: number;
  groupe_id?: number;
  filiere_id?: number;
  module?: { id?: number; code?: string; label?: string };
  groupe?: { id?: number; label?: string };
  teacher?: { name?: string };
  // Legacy affectation path (kept for backward-compat)
  affectation?: {
    module?: { code?: string; label: string };
    groupe?: { label: string };
    formateur?: { user?: { name: string } };
  };
}

export interface ScheduleScopeMeta {
  requested_groupe_id: number | null;
  effective_group_ids: number[];
  effective_filiere_id: number | null;
}

export interface TimetableResponse {
  week_start: string;
  week_end: string;
  seances: TimetableSeance[];
  by_date: Record<string, TimetableSeance[]>;
  scope?: ScheduleScopeMeta;
}

export interface SeanceFormData {
  module_id: number;
  groupe_id?: number | null;
  filiere_id?: number | null;
  date: string;
  start_time: string;
  end_time: string;
  salle?: string;
  type?: 'presentiel' | 'distance';
  status?: 'planifie' | 'realise' | 'annule';
  user_id?: number; // admin only
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const emptyTimetable = (): TimetableResponse => ({
  week_start: '',
  week_end: '',
  seances: [],
  by_date: {},
});

function extractSchedulesFromPayload(data: unknown): TimetableSeance[] {
  if (!data || typeof data !== 'object') return [];
  const d = data as Record<string, unknown>;
  if (Array.isArray(d.schedules)) return d.schedules as TimetableSeance[];
  if (Array.isArray(d.seances)) return d.seances as TimetableSeance[];
  return [];
}

// ── API ──────────────────────────────────────────────────────────────────────

export const timetableApi = {
  get: async (params?: {
    groupe_id?: number;
    formateur_id?: number;
    week_start?: string;
  }): Promise<TimetableResponse> => {
    const res = await api.get<ApiResponse<TimetableResponse>>('/schedules', { params });
    let data: TimetableResponse | undefined;
    try {
      data = unwrapData<TimetableResponse>(res);
    } catch {
      data = undefined;
    }
    if (!data || typeof data !== 'object') return emptyTimetable();
    const schedules = extractSchedulesFromPayload(data);
    return {
      week_start: data.week_start ?? '',
      week_end: data.week_end ?? '',
      seances: schedules,
      by_date:
        data.by_date && typeof data.by_date === 'object' && !Array.isArray(data.by_date)
          ? data.by_date
          : {},
      scope: data.scope,
    };
  },

  create: async (body: SeanceFormData): Promise<TimetableSeance> => {
    const res = await api.post<ApiResponse<TimetableSeance>>('/timetable', body);
    return unwrapData<TimetableSeance>(res);
  },

  update: async (id: number, body: Partial<SeanceFormData>): Promise<TimetableSeance> => {
    const res = await api.put<ApiResponse<TimetableSeance>>(`/timetable/${id}`, body);
    return unwrapData<TimetableSeance>(res);
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/timetable/${id}`);
  },
};

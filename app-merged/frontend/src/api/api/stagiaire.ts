import api from '../../lib/axios';
import { unwrapData, type ApiResponse } from '../../lib/api';
import type { TimetableResponse, TimetableSeance } from './timetable';

export interface StagiaireModuleRow {
  id: number;
  code: string;
  name: string;
  description: string | null;
  coefficient?: number;
  semester?: string | null;
  masse_horaire?: number;
}

export interface StagiaireModulesMeta {
  filiere?: { id: number; code: string; label: string };
}

export interface StagiaireGroupInfo {
  id: number;
  name: string;
  label: string;
  year_level?: number | null;
  filiere: { id: number; code: string; label: string } | null;
}

export interface StagiaireGroupMember {
  id: number;
  name: string | null;
  email: string | null;
}

export interface StagiaireGroupOverview {
  group: StagiaireGroupInfo | null;
  members: StagiaireGroupMember[];
  timetable: TimetableResponse;
  modules: StagiaireModuleRow[];
}

export interface StagiaireNoteRow {
  id: number;
  value: number;
  evaluation: { id: number; label: string | null } | null;
  module: { id: number; code: string | null; label: string | null } | null;
  date: string | null;
}

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

export const stagiaireApi = {
  /** Mon groupe: membres, emploi du temps du groupe, modules filière/groupe (lecture seule). */
  groupOverview: async (params?: { week_start?: string }): Promise<StagiaireGroupOverview> => {
    const res = await api.get<ApiResponse<StagiaireGroupOverview>>('/stagiaire/group', { params });
    const data = unwrapData<StagiaireGroupOverview>(res);
    return {
      group: data.group ?? null,
      members: Array.isArray(data.members) ? data.members : [],
      timetable: {
        week_start: data.timetable?.week_start ?? '',
        week_end: data.timetable?.week_end ?? '',
        seances: Array.isArray(data.timetable?.seances) ? data.timetable.seances : [],
        by_date:
          data.timetable?.by_date && typeof data.timetable.by_date === 'object' && !Array.isArray(data.timetable.by_date)
            ? (data.timetable.by_date as Record<string, TimetableSeance[]>)
            : {},
      },
      modules: Array.isArray(data.modules) ? data.modules : [],
    };
  },

  modules: async (): Promise<{ modules: StagiaireModuleRow[]; meta: StagiaireModulesMeta }> => {
    const res = await api.get<ApiResponse<StagiaireModuleRow[]>>('/stagiaire/modules');
    const modules = unwrapData<StagiaireModuleRow[]>(res);
    const meta =
      res.data && typeof res.data === 'object' && 'meta' in res.data
        ? ((res.data as ApiResponse<StagiaireModuleRow[]> & { meta?: StagiaireModulesMeta }).meta ?? {})
        : {};
    return { modules: Array.isArray(modules) ? modules : [], meta };
  },

  /** Filière-scoped emploi du temps (read-only). */
  timetable: async (params?: { week_start?: string }): Promise<TimetableResponse> => {
    const res = await api.get<ApiResponse<TimetableResponse>>('/stagiaire/timetable', { params });
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
          ? (data.by_date as Record<string, TimetableSeance[]>)
          : {},
      scope: data.scope,
    };
  },

  notes: async (): Promise<StagiaireNoteRow[]> => {
    const res = await api.get<ApiResponse<StagiaireNoteRow[]>>('/stagiaire/notes');
    const rows = unwrapData<StagiaireNoteRow[]>(res);
    return Array.isArray(rows) ? rows : [];
  },
};

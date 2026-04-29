import api from '../../lib/axios';
import { unwrapData, type ApiResponse } from '../../lib/api';

// ── Types ────────────────────────────────────────────────────────────────────

export interface TimetableFiliere {
  code: string;
  label: string;
  group_label: string | null;
  academic_year: string | null;
  session: number | null;
  source: string | null;
  file: string;
}

export interface TimetableDataSeance {
  id: number;
  date: string;
  day: string;
  start_time: string;
  end_time: string;
  shift: string | null;
  subject: string | null;
  salle: string | null;
  status: 'planifie' | 'realise' | 'annule' | string;
  type: 'presentiel' | 'distance' | string;
  scope: 'filiere' | string;
  filiere_code: string;
  group_label: string | null;
  module: { code: string | null; label: string | null };
  teacher: { name: string | null };
  groupe: { label: string } | null;
}

export interface TimetableDataResponse {
  week_start: string;
  week_end: string;
  filiere_code: string | null;
  filiere_label: string | null;
  group_label: string | null;
  academic_year: string | null;
  session: number | null;
  time_slots: Record<string, [string, string][]>;
  modules: { code: string; label: string }[];
  schedules: TimetableDataSeance[];
  by_date: Record<string, TimetableDataSeance[]>;
}

// ── API ──────────────────────────────────────────────────────────────────────

export const timetableDataApi = {
  /**
   * List all filières found in the JSON data files.
   * Works for every authenticated role.
   */
  getFilieres: (): Promise<TimetableFiliere[]> =>
    api
      .get<ApiResponse<TimetableFiliere[]>>('/timetable-data/filieres')
      .then(unwrapData),

  /**
   * Fetch the recurring weekly timetable for a filière from its JSON file,
   * projected onto real calendar dates for the given week.
   */
  getByFiliere: (params: {
    filiere_code: string;
    week_start?: string;
  }): Promise<TimetableDataResponse> =>
    api
      .get<ApiResponse<TimetableDataResponse>>('/timetable-data', { params })
      .then((res) => {
        let data: TimetableDataResponse | undefined;
        try {
          data = unwrapData<TimetableDataResponse>(res);
        } catch {
          data = undefined;
        }
        if (!data || typeof data !== 'object') {
          return {
            week_start: '',
            week_end: '',
            filiere_code: params.filiere_code,
            filiere_label: null,
            group_label: null,
            academic_year: null,
            session: null,
            time_slots: {},
            modules: [],
            schedules: [],
            by_date: {},
          } satisfies TimetableDataResponse;
        }
        return data;
      }),
};

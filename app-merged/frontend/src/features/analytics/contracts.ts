export interface AnalyticsFiltersContract {
  filiere_id?: number;
  module_id?: number;
  group_id?: number;
  date_from?: string;
  date_to?: string;
}

export type RiskLevel = 'low' | 'medium' | 'high';
export type RiskPrediction = 'pass' | 'fail';

export interface AtRiskStudentContract {
  student_id: number;
  student_name: string;
  average_grade: number;
  attendance_rate: number;
  risk_score: number;
  risk_level: RiskLevel;
  prediction: RiskPrediction;
  explanation: string;
  recommendations: string[];
}

export interface AnalyticsOverviewContract {
  kpis: {
    total_students: number;
    total_teachers?: number;
    total_filieres?: number;
    total_groupes?: number;
    active_modules: number;
    attendance_rate: number;
    average_grade: number;
  };
  charts: {
    grade_distribution: { bucket: string; count: number }[];
    progress_over_time: { period: string; avg_grade: number }[];
    attendance_trends: { period: string; attendance_rate: number; absent_count: number }[];
  };
  ai: {
    at_risk_students: AtRiskStudentContract[];
    recommendations: string[];
  };
}

export interface RankedAtRiskStudentContract extends AtRiskStudentContract {
  risk_rank: number;
}

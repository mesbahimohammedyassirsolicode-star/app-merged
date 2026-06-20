import type {
  AtRiskStudentContract,
  RankedAtRiskStudentContract,
  RiskLevel,
  RiskPrediction,
} from '../contracts';

const riskLevelWeight: Record<RiskLevel, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

const predictionWeight: Record<RiskPrediction, number> = {
  fail: 2,
  pass: 1,
};

function compareByRisk(a: AtRiskStudentContract, b: AtRiskStudentContract) {
  const scoreDiff = b.risk_score - a.risk_score;
  if (scoreDiff !== 0) return scoreDiff;

  const levelDiff = riskLevelWeight[b.risk_level] - riskLevelWeight[a.risk_level];
  if (levelDiff !== 0) return levelDiff;

  const predictionDiff = predictionWeight[b.prediction] - predictionWeight[a.prediction];
  if (predictionDiff !== 0) return predictionDiff;

  const attendanceDiff = a.attendance_rate - b.attendance_rate;
  if (attendanceDiff !== 0) return attendanceDiff;

  return a.student_name.localeCompare(b.student_name);
}

export function rankAtRiskStudents(
  students: AtRiskStudentContract[],
  options?: { limit?: number }
): RankedAtRiskStudentContract[] {
  const limit = options?.limit ?? students.length;

  return [...students]
    .sort(compareByRisk)
    .slice(0, Math.max(0, limit))
    .map((student, index) => ({
      ...student,
      risk_rank: index + 1,
    }));
}

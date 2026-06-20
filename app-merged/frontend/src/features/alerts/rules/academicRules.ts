/**
 * Deterministic rules for academic alerts.
 * These functions must remain pure and free from side-effects or LLM hallucination.
 */

/**
 * Evaluates if a student's risk score has crossed a critical threshold.
 * @param riskScore The computed risk score (0-100)
 * @param threshold The threshold to consider high risk (default: 80)
 */
export const evaluateHighRiskScore = (
  riskScore: number,
  threshold = 80
): boolean => {
  return riskScore > threshold;
};

/**
 * Evaluates if a module's performance or a student's grade has significantly declined.
 * @param currentGrade The new grade
 * @param oldGrade The previous grade
 * @param threshold Minimum drop percentage or absolute value to trigger an alert (default: 20)
 */
export const evaluatePerformanceDecline = (
  currentGrade: number,
  oldGrade: number,
  threshold = 20
): boolean => {
  if (oldGrade <= 0) return false;
  
  // Calculate percentage drop
  const dropPercentage = ((oldGrade - currentGrade) / oldGrade) * 100;
  return dropPercentage >= threshold;
};

/**
 * Evaluates a sudden anomaly spike (e.g. failure rate in a module).
 * @param currentMetric Current value of the metric
 * @param historicalAverage Historical average of the metric
 * @param deviationThreshold Minimum deviation ratio to trigger an alert (default: 1.5 - meaning 50% higher)
 */
export const evaluateAnomalySpike = (
  currentMetric: number,
  historicalAverage: number,
  deviationThreshold = 1.5
): boolean => {
  if (historicalAverage <= 0) return currentMetric > 0; // If history was 0, any increase is a spike
  return (currentMetric / historicalAverage) >= deviationThreshold;
};

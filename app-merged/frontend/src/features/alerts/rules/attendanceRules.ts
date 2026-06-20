/**
 * Deterministic rules for attendance alerts.
 * These functions must remain pure and free from side-effects or LLM hallucination.
 */

/**
 * Evaluates if an attendance drop is significant enough to warrant an alert.
 * @param currentRate Current attendance rate (0-100)
 * @param previousRate Previous attendance rate (0-100)
 * @param threshold Minimum drop percentage to trigger an alert (default: 15)
 */
export const evaluateAttendanceDrop = (
  currentRate: number,
  previousRate: number,
  threshold = 15
): boolean => {
  if (previousRate <= 0) return false;
  const drop = previousRate - currentRate;
  return drop >= threshold;
};

/**
 * Evaluates if a student has repeated consecutive absences.
 * @param consecutiveAbsences Number of consecutive absences
 * @param threshold Minimum number of consecutive absences to trigger an alert (default: 3)
 */
export const evaluateRepeatedAbsences = (
  consecutiveAbsences: number,
  threshold = 3
): boolean => {
  return consecutiveAbsences >= threshold;
};

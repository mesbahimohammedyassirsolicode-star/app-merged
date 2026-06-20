import { AlertRecord } from '../contracts/contracts';

/**
 * Transforms deterministic active alerts into a structured string or object
 * that the AI Copilot can use as context without hallucinating facts.
 * 
 * @param activeAlerts Current active alerts in the system
 * @returns A structured context string for the LLM prompt inject
 */
export const generateCopilotAlertContext = (activeAlerts: AlertRecord[]): string => {
  if (activeAlerts.length === 0) {
    return "No active proactive alerts.";
  }

  const critical = activeAlerts.filter(a => a.severity === 'critical');
  const warning = activeAlerts.filter(a => a.severity === 'warning');

  let context = "ACTIVE PROACTIVE INTELLIGENCE ALERTS:\n";

  if (critical.length > 0) {
    context += `\n[CRITICAL ALERTS - ${critical.length}]\n`;
    critical.forEach(alert => {
      context += `- [${alert.category.toUpperCase()}] ${alert.title}: ${alert.description}\n`;
    });
  }

  if (warning.length > 0) {
    context += `\n[WARNING ALERTS - ${warning.length}]\n`;
    warning.forEach(alert => {
      context += `- [${alert.category.toUpperCase()}] ${alert.title}: ${alert.description}\n`;
    });
  }

  context += "\nINSTRUCTION: Incorporate these alerts into your summary if they are relevant to the user's current query. Do not invent new alerts.";

  return context;
};

import { InterventionRecord } from '../contracts/contracts';

/**
 * Transforms operational workflow state into a deterministic, structured context 
 * block for the AI Copilot. Prevents hallucination of operational status.
 * 
 * @param interventions The list of all interventions
 * @returns A structured context string
 */
export const generateInterventionCopilotContext = (interventions: InterventionRecord[]): string => {
  const unresolved = interventions.filter(i => !['resolved', 'dismissed'].includes(i.status));
  
  if (unresolved.length === 0) {
    return "OPERATIONAL STATUS: All interventions are resolved. No pending workflows.";
  }

  const critical = unresolved.filter(i => i.priority === 'high');
  const unassigned = unresolved.filter(i => i.status === 'pending');

  let context = "OPERATIONAL WORKFLOW STATUS (DO NOT HALLUCINATE BEYOND THIS DATA):\n\n";
  
  context += `Total Unresolved Interventions: ${unresolved.length}\n`;
  context += `Critical Priority Unresolved: ${critical.length}\n`;
  context += `Unassigned (Pending) Workflows: ${unassigned.length}\n\n`;

  if (critical.length > 0) {
    context += "[CRITICAL WORKFLOWS REQUIRING ATTENTION]\n";
    critical.forEach(i => {
      context += `- ID: ${i.id} | Status: ${i.status} | Title: ${i.title}\n`;
      const daysOpen = Math.round((new Date().getTime() - new Date(i.createdAt).getTime()) / (1000 * 3600 * 24));
      if (daysOpen > 0) {
        context += `  WARNING: Unresolved for ${daysOpen} days.\n`;
      }
    });
  }

  context += "\nINSTRUCTION: When asked about operational status or pending tasks, strictly refer to these numbers. Recommend the user to assign 'Pending' tasks or 'Resolve' in-progress critical tasks.";

  return context;
};

import { InterventionRecord, InterventionPriority, InterventionAction } from '../contracts/contracts';
import { createTimelineEntry } from '../tracking/timelineEngine';
import { AlertRecord } from '../../alerts/contracts/contracts';

/**
 * Maps an Alert's severity to an Intervention's priority.
 */
const mapSeverityToPriority = (severity: AlertRecord['severity']): InterventionPriority => {
  switch (severity) {
    case 'critical': return 'high';
    case 'warning': return 'medium';
    case 'info': return 'low';
    default: return 'low';
  }
};

/**
 * Deterministically generates recommended actions based on the alert category and severity.
 */
const generateActionsForAlert = (alert: AlertRecord): InterventionAction[] => {
  const actions: InterventionAction[] = [];

  if (alert.category === 'attendance' && alert.severity === 'critical') {
    actions.push({
      id: crypto.randomUUID(),
      type: 'contact_parent',
      description: 'Contact parents regarding consecutive absences.',
    });
    actions.push({
      id: crypto.randomUUID(),
      type: 'schedule_meeting',
      description: 'Schedule an academic counseling meeting.',
    });
  } else if (alert.category === 'academic' && alert.severity === 'critical') {
    actions.push({
      id: crypto.randomUUID(),
      type: 'teacher_review',
      description: 'Request module teacher to review student performance.',
    });
    actions.push({
      id: crypto.randomUUID(),
      type: 'assign_tutoring',
      description: 'Enroll student in remedial sessions.',
    });
  } else if (alert.recommendation) {
    actions.push({
      id: crypto.randomUUID(),
      type: 'general_action',
      description: alert.recommendation,
    });
  }

  return actions;
};

/**
 * Parses the affectedEntities array to extract studentId or moduleId.
 */
const extractEntityId = (entities: string[], prefix: string): number | undefined => {
  const entity = entities.find(e => e.startsWith(`${prefix}:`));
  if (entity) {
    return parseInt(entity.split(':')[1], 10);
  }
  return undefined;
};

/**
 * Deterministically maps a proactive alert into an actionable intervention workflow.
 * 
 * @param alert The source AlertRecord
 * @returns A newly instantiated InterventionRecord
 */
export const mapAlertToIntervention = (alert: AlertRecord): InterventionRecord => {
  const priority = mapSeverityToPriority(alert.severity);
  const actions = generateActionsForAlert(alert);
  
  const creationTimeline = createTimelineEntry(
    'created',
    `Intervention automatically generated from ${alert.severity} alert: ${alert.title}`,
    'system',
    { sourceAlertId: alert.id }
  );

  return {
    id: crypto.randomUUID(),
    alertId: alert.id,
    title: `Follow up: ${alert.title}`,
    description: alert.description,
    studentId: extractEntityId(alert.affectedEntities, 'student'),
    moduleId: extractEntityId(alert.affectedEntities, 'module'),
    status: 'pending',
    priority,
    actions,
    timeline: [creationTimeline],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

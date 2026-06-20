import { InterventionRecord, InterventionStatus } from '../contracts/contracts';
import { createTimelineEntry } from '../tracking/timelineEngine';

const VALID_TRANSITIONS: Record<InterventionStatus, InterventionStatus[]> = {
  pending: ['assigned', 'dismissed'],
  assigned: ['acknowledged', 'pending'], // Can be unassigned
  acknowledged: ['in_progress'],
  in_progress: ['resolved', 'pending'], // Can be moved back if blocked
  resolved: [], // Terminal state
  dismissed: [], // Terminal state
};

/**
 * Checks if a transition between two states is valid based on the deterministic state machine.
 */
export const isValidTransition = (current: InterventionStatus, next: InterventionStatus): boolean => {
  return VALID_TRANSITIONS[current]?.includes(next) ?? false;
};

/**
 * Applies a state transition to an intervention, throwing an error if invalid.
 * Appends the change to the timeline.
 */
export const applyTransition = (
  intervention: InterventionRecord,
  nextStatus: InterventionStatus,
  actorId: string = 'system',
  reason?: string
): InterventionRecord => {
  if (!isValidTransition(intervention.status, nextStatus)) {
    throw new Error(`Invalid transition from ${intervention.status} to ${nextStatus}`);
  }

  const description = reason 
    ? `Status changed from ${intervention.status} to ${nextStatus}. Reason: ${reason}`
    : `Status changed from ${intervention.status} to ${nextStatus}.`;

  const timelineEntry = createTimelineEntry('status_change', description, actorId, {
    from: intervention.status,
    to: nextStatus
  });

  return {
    ...intervention,
    status: nextStatus,
    updatedAt: new Date().toISOString(),
    timeline: [timelineEntry, ...intervention.timeline] // Newest first
  };
};

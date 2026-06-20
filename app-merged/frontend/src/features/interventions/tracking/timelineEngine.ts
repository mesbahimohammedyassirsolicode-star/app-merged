import { InterventionTimelineEntry } from '../contracts/contracts';

/**
 * Creates an immutable timeline entry for an intervention.
 * 
 * @param type The type of event that occurred.
 * @param description Human-readable description of the event.
 * @param actorId The user ID who performed the action, or 'system' if automated.
 * @param metadata Optional contextual data.
 */
export const createTimelineEntry = (
  type: InterventionTimelineEntry['type'],
  description: string,
  actorId: string | 'system' = 'system',
  metadata?: Record<string, unknown>
): InterventionTimelineEntry => {
  return {
    id: crypto.randomUUID(),
    type,
    description,
    timestamp: new Date().toISOString(),
    actorId,
    metadata,
  };
};

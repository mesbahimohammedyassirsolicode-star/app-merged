import type { AppDomainEvent } from '../../realtime/contracts/events';
import { getTriggersForEvent } from '../triggers/triggerEngine';
import { useAlertStore } from '../store/alertStore';
import type { AlertRecord } from '../contracts/contracts';

/**
 * The main pipeline for processing incoming realtime events and evaluating alert rules.
 * This function acts as the deterministic boundary:
 * Event -> Pipeline -> Rules -> Alert Store.
 * 
 * @param event The incoming domain event
 * @param context Additional analytics context needed for rules evaluation (e.g. historical averages, previous rates). 
 *                In a real app, this might be fetched or passed along with the event payload.
 */
export const processEventForAlerts = (event: AppDomainEvent, context?: any) => {
  const triggers = getTriggersForEvent(event.type);

  if (!triggers || triggers.length === 0) {
    return; // No triggers registered for this event type
  }

  // Iterate over all triggers for this event type
  triggers.forEach((trigger) => {
    try {
      // 1. Evaluate Rule (Deterministic)
      const isTriggered = trigger.evaluate(event.payload, context);

      if (isTriggered) {
        // 2. Generate Alert Structure
        const partialAlert = trigger.generateAlert(event.payload, context);

        const alert: AlertRecord = {
          ...partialAlert,
          id: crypto.randomUUID(),
          triggeredAt: new Date().toISOString(), // Use local time for timestamp
        };

        // 3. Dispatch to State
        // The store handles guardrails like deduplication
        useAlertStore.getState().addAlert(alert);

        // Optional: Trigger a notification dispatch here if required.
        // Optional: Trigger copilot context refresh.
      }
    } catch (error) {
      console.error(`[AlertPipeline] Error evaluating trigger ${trigger.id} for event ${event.type}:`, error);
      // Fail gracefully so one broken rule doesn't crash the pipeline
    }
  });
};

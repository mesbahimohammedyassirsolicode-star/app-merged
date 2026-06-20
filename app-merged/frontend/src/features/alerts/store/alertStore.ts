import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { AlertRecord } from '../contracts/contracts';

interface AlertState {
  activeAlerts: AlertRecord[];
  addAlert: (alert: AlertRecord) => void;
  dismissAlert: (alertId: string) => void;
  clearAll: () => void;
}

const MAX_ALERTS = 50;

export const useAlertStore = create<AlertState>()(
  devtools(
    (set) => ({
      activeAlerts: [],
      addAlert: (alert) => {
        set((state) => {
          // Guardrail: prevent duplicate alert storms by checking if an identical alert was recently generated
          const isDuplicate = state.activeAlerts.some(
            a => a.sourceEvent === alert.sourceEvent && 
                 a.title === alert.title && 
                 JSON.stringify(a.affectedEntities) === JSON.stringify(alert.affectedEntities) &&
                 (new Date().getTime() - new Date(a.triggeredAt).getTime() < 60000) // Within 60 seconds
          );

          if (isDuplicate) return state;

          const newAlerts = [alert, ...state.activeAlerts];
          // Guardrail: limit active alerts to prevent memory bloat
          if (newAlerts.length > MAX_ALERTS) {
            newAlerts.length = MAX_ALERTS;
          }

          return { activeAlerts: newAlerts };
        }, false, 'alertStore/addAlert');
      },
      dismissAlert: (alertId) => {
        set((state) => ({
          activeAlerts: state.activeAlerts.filter((a) => a.id !== alertId),
        }), false, 'alertStore/dismissAlert');
      },
      clearAll: () => {
        set({ activeAlerts: [] }, false, 'alertStore/clearAll');
      },
    }),
    { name: 'AlertStore' }
  )
);

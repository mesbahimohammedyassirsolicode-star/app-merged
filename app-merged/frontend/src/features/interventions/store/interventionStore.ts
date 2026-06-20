import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { InterventionRecord, InterventionStatus } from '../contracts/contracts';
import { applyTransition } from '../workflows/stateMachine';

interface InterventionState {
  interventions: InterventionRecord[];
  addIntervention: (intervention: InterventionRecord) => void;
  updateStatus: (id: string, newStatus: InterventionStatus, actorId?: string, reason?: string) => void;
  assignUser: (id: string, userId: string, actorId?: string) => void;
}

export const useInterventionStore = create<InterventionState>()(
  devtools(
    (set, get) => ({
      interventions: [],
      addIntervention: (intervention) => {
        set((state) => {
          // Guardrail: prevent duplicate interventions for the same alert
          const exists = state.interventions.some(i => i.alertId === intervention.alertId);
          if (exists) return state;

          return { interventions: [intervention, ...state.interventions] };
        }, false, 'interventionStore/addIntervention');
      },
      updateStatus: (id, newStatus, actorId = 'system', reason) => {
        set((state) => {
          const interventions = state.interventions.map(inv => {
            if (inv.id === id) {
              try {
                // This will throw if invalid, keeping state intact
                return applyTransition(inv, newStatus, actorId, reason);
              } catch (e) {
                console.error(e);
                return inv;
              }
            }
            return inv;
          });
          return { interventions };
        }, false, 'interventionStore/updateStatus');
      },
      assignUser: (id, userId, actorId = 'system') => {
        set((state) => {
          const interventions = state.interventions.map(inv => {
            if (inv.id === id) {
              // Create optimistic transition to 'assigned' if pending
              let updatedInv = inv;
              if (inv.status === 'pending') {
                try {
                  updatedInv = applyTransition(inv, 'assigned', actorId, `Assigned to user ${userId}`);
                } catch(e) {
                  console.error(e);
                }
              }
              return { ...updatedInv, assignedTo: userId, updatedAt: new Date().toISOString() };
            }
            return inv;
          });
          return { interventions };
        }, false, 'interventionStore/assignUser');
      }
    }),
    { name: 'InterventionStore' }
  )
);

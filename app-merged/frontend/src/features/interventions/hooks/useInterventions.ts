import { useInterventionStore } from '../store/interventionStore';
import { useMemo } from 'react';

/**
 * Hook to access and interact with operational interventions.
 */
export const useInterventions = () => {
  const interventions = useInterventionStore((state) => state.interventions);
  const updateStatus = useInterventionStore((state) => state.updateStatus);
  const assignUser = useInterventionStore((state) => state.assignUser);

  // Selectors
  const openInterventions = useMemo(() => {
    return interventions.filter(i => 
      ['pending', 'assigned', 'acknowledged', 'in_progress'].includes(i.status)
    );
  }, [interventions]);

  const criticalInterventions = useMemo(() => {
    return openInterventions.filter(i => i.priority === 'high');
  }, [openInterventions]);

  return {
    interventions,
    openInterventions,
    criticalInterventions,
    updateStatus,
    assignUser,
  };
};

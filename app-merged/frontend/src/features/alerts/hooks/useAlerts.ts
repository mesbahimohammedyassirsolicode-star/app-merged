import { useAlertStore } from '../store/alertStore';
import type { AlertRecord, AlertSeverity } from '../contracts/contracts';
import { useMemo } from 'react';

/**
 * Hook to access and interact with proactive alerts.
 */
export const useAlerts = () => {
  const activeAlerts = useAlertStore((state) => state.activeAlerts);
  const dismissAlert = useAlertStore((state) => state.dismissAlert);
  const clearAll = useAlertStore((state) => state.clearAll);

  /**
   * Get alerts filtered by severity.
   */
  const getAlertsBySeverity = (severity: AlertSeverity): AlertRecord[] => {
    return activeAlerts.filter((alert) => alert.severity === severity);
  };

  /**
   * Get a computed summary of alerts for quick metrics (e.g. badge counts).
   */
  const alertSummary = useMemo(() => {
    return {
      total: activeAlerts.length,
      critical: activeAlerts.filter((a) => a.severity === 'critical').length,
      warning: activeAlerts.filter((a) => a.severity === 'warning').length,
      info: activeAlerts.filter((a) => a.severity === 'info').length,
    };
  }, [activeAlerts]);

  return {
    activeAlerts,
    dismissAlert,
    clearAll,
    getAlertsBySeverity,
    alertSummary,
  };
};

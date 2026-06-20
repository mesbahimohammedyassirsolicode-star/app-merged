import React, { Suspense } from 'react';
import { useAlerts } from '../hooks/useAlerts';
import { AlertCard } from './AlertCard';
import { AnimatePresence } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';
import { ErrorBoundary } from 'react-error-boundary';
import type { FallbackProps } from 'react-error-boundary';

const CriticalAlertsContent: React.FC = () => {
  const { activeAlerts, dismissAlert } = useAlerts();

  // Only show critical and warning alerts in this widget
  const visibleAlerts = activeAlerts.filter(a => a.severity === 'critical' || a.severity === 'warning');

  if (visibleAlerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-theme-surface/50 rounded-xl border border-theme-border border-dashed">
        <div className="w-12 h-12 bg-slate-700/30 rounded-full flex items-center justify-center mb-3 text-theme-text-secondary">
          <ShieldAlert size={24} />
        </div>
        <h3 className="text-sm font-semibold text-theme-text-primary">No Critical Alerts</h3>
        <p className="text-xs text-theme-text-secondary mt-1">System intelligence is monitoring for risks.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
      <AnimatePresence mode="popLayout">
        {visibleAlerts.map(alert => (
          <AlertCard 
            key={alert.id} 
            alert={alert} 
            onDismiss={dismissAlert} 
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600">
      <h3 className="text-sm font-semibold mb-1">Failed to load alerts</h3>
      <p className="text-xs">{String(error)}</p>
      <button 
        onClick={resetErrorBoundary}
        className="mt-2 text-xs underline hover:no-underline"
      >
        Try again
      </button>
    </div>
  );
}

/**
 * Isolated widget for displaying critical and warning alerts.
 * Uses ErrorBoundary to prevent widget failures from crashing the dashboard.
 */
export const CriticalAlertsWidget: React.FC = () => {
  return (
    <div className="bg-theme-surface rounded-2xl shadow-sm border border-theme-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-theme-text-primary flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          Proactive Intelligence
        </h2>
        {/* Optional: Add a "Clear All" or "View History" button here */}
      </div>
      
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Suspense fallback={<div className="h-32 animate-pulse bg-slate-700/30 rounded-xl"></div>}>
          <CriticalAlertsContent />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
};

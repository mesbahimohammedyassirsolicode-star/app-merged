import React, { Suspense } from 'react';
import { useInterventions } from '../hooks/useInterventions';
import { InterventionCard } from './InterventionCard';
import { ErrorBoundary } from 'react-error-boundary';
import type { FallbackProps } from 'react-error-boundary';
import { AnimatePresence } from 'framer-motion';
import { CheckSquare } from 'lucide-react';

const OpenInterventionsContent: React.FC = () => {
  const { openInterventions, updateStatus, assignUser } = useInterventions();

  if (openInterventions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-theme-surface/50 rounded-xl border border-theme-border border-dashed">
        <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-3 text-emerald-400">
          <CheckSquare size={24} />
        </div>
        <h3 className="text-sm font-semibold text-theme-text-primary">All caught up</h3>
        <p className="text-xs text-theme-text-secondary mt-1">No pending operational interventions.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <AnimatePresence mode="popLayout">
        {openInterventions.map(intervention => (
          <InterventionCard 
            key={intervention.id}
            intervention={intervention}
            onUpdateStatus={updateStatus}
            onAssign={(id) => assignUser(id, 'current_user_id')} // Mocked user ID for now
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600">
      <h3 className="text-sm font-semibold mb-1">Failed to load workflows</h3>
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
 * Enterprise-grade widget to display open interventions.
 * Uses isolated boundaries to prevent crashes.
 */
export const OpenInterventionsWidget: React.FC = () => {
  return (
    <div className="bg-theme-surface rounded-2xl shadow-sm border border-theme-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-theme-text-primary">Operational Workflows</h2>
          <p className="text-xs text-theme-text-secondary mt-0.5">Manage and track proactive interventions</p>
        </div>
      </div>
      
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Suspense fallback={<div className="h-40 animate-pulse bg-slate-700/30 rounded-xl"></div>}>
          <OpenInterventionsContent />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
};

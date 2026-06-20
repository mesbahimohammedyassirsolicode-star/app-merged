import React from 'react';
import { InterventionTimelineEntry } from '../contracts/contracts';

interface InterventionTimelineWidgetProps {
  timeline: InterventionTimelineEntry[];
}

/**
 * Renders the immutable operational history of an intervention.
 */
export const InterventionTimelineWidget: React.FC<InterventionTimelineWidgetProps> = ({ timeline }) => {
  if (!timeline || timeline.length === 0) {
    return <div className="text-xs text-theme-text-secondary italic">No timeline events recorded.</div>;
  }

  return (
    <div className="relative pl-3 border-l-2 border-theme-border space-y-4 my-2">
      {timeline.map((entry, index) => (
        <div key={entry.id} className="relative">
          {/* Timeline Dot */}
          <span className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-slate-300 ring-4 ring-white" />
          
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-theme-text-primary">
                {entry.type.replace('_', ' ').toUpperCase()}
              </span>
              <span className="text-[10px] text-theme-text-secondary">
                {new Date(entry.timestamp).toLocaleString()}
              </span>
            </div>
            
            <p className="text-xs text-theme-text-secondary mt-0.5 leading-relaxed">
              {entry.description}
            </p>
            
            {entry.actorId && (
              <span className="text-[10px] text-theme-text-secondary mt-1">
                Actor: {entry.actorId}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

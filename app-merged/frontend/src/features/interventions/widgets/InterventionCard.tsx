import React from 'react';
import { InterventionRecord, InterventionStatus } from '../contracts/contracts';
import { motion } from 'framer-motion';
import { Activity, CheckCircle, Clock, FileText, User } from 'lucide-react';

interface InterventionCardProps {
  intervention: InterventionRecord;
  onUpdateStatus: (id: string, status: InterventionStatus) => void;
  onAssign: (id: string) => void;
}

const statusColors: Record<InterventionStatus, string> = {
  pending: 'bg-slate-700/30 text-theme-text-primary',
  assigned: 'bg-blue-500/20 text-blue-700',
  acknowledged: 'bg-indigo-100 text-indigo-700',
  in_progress: 'bg-amber-100 text-amber-400',
  resolved: 'bg-emerald-100 text-emerald-400',
  dismissed: 'bg-slate-200 text-theme-text-secondary',
};

const priorityBorder: Record<string, string> = {
  low: 'border-theme-border',
  medium: 'border-amber-300',
  high: 'border-red-400',
};

export const InterventionCard: React.FC<InterventionCardProps> = ({ 
  intervention, 
  onUpdateStatus, 
  onAssign 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-theme-surface rounded-xl border ${priorityBorder[intervention.priority]} shadow-sm p-4 hover:shadow-md transition-shadow`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <Activity className={`w-5 h-5 ${intervention.priority === 'high' ? 'text-red-500' : 'text-theme-text-secondary'}`} />
          <h4 className="font-bold text-theme-text-primary text-sm">{intervention.title}</h4>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-semibold uppercase tracking-wide ${statusColors[intervention.status]}`}>
          {intervention.status.replace('_', ' ')}
        </span>
      </div>

      <p className="text-sm text-theme-text-secondary mb-4 line-clamp-2">
        {intervention.description}
      </p>

      {intervention.actions.length > 0 && (
        <div className="mb-4 bg-theme-surface rounded-lg p-3">
          <span className="text-xs font-bold text-theme-text-secondary uppercase flex items-center gap-1 mb-2">
            <FileText size={12} /> Suggested Actions
          </span>
          <ul className="text-xs text-theme-text-primary space-y-1">
            {intervention.actions.map(action => (
              <li key={action.id} className="flex items-start gap-1">
                <span className="text-theme-text-secondary mt-0.5">•</span> {action.description}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-theme-border">
        <div className="flex items-center gap-3 text-xs text-theme-text-secondary">
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span>{new Date(intervention.createdAt).toLocaleDateString()}</span>
          </div>
          {intervention.assignedTo ? (
            <div className="flex items-center gap-1">
              <User size={14} />
              <span>Assigned</span>
            </div>
          ) : (
            <span className="text-amber-600 font-medium">Unassigned</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!intervention.assignedTo && intervention.status === 'pending' && (
            <button 
              onClick={() => onAssign(intervention.id)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
            >
              Assign to me
            </button>
          )}
          
          {intervention.status === 'assigned' && (
            <button 
              onClick={() => onUpdateStatus(intervention.id, 'in_progress')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Start Work
            </button>
          )}

          {intervention.status === 'in_progress' && (
            <button 
              onClick={() => onUpdateStatus(intervention.id, 'resolved')}
              className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-800 transition-colors bg-emerald-500/10 px-2 py-1 rounded"
            >
              <CheckCircle size={14} /> Resolve
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

import React from 'react';
import { AlertRecord } from '../contracts/contracts';
import { motion } from 'framer-motion';
import { AlertTriangle, Info, ShieldAlert, X } from 'lucide-react';

interface AlertCardProps {
  alert: AlertRecord;
  onDismiss: (id: string) => void;
}

const severityConfig = {
  critical: {
    icon: ShieldAlert,
    color: 'text-red-600',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    badge: 'bg-red-100 text-red-400',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-600',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    badge: 'bg-amber-100 text-amber-400',
  },
  info: {
    icon: Info,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-blue-500/20 text-blue-700',
  },
};

export const AlertCard: React.FC<AlertCardProps> = ({ alert, onDismiss }) => {
  const config = severityConfig[alert.severity];
  const Icon = config.icon;

  // Format relative time (e.g., "2 mins ago")
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const timeDiff = Math.round((new Date(alert.triggeredAt).getTime() - new Date().getTime()) / 60000);
  const timeString = rtf.format(timeDiff, 'minute');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`relative p-4 rounded-xl border ${config.bg} ${config.border} shadow-sm transition-all hover:shadow-md`}
    >
      <button 
        onClick={() => onDismiss(alert.id)}
        className="absolute top-3 right-3 text-theme-text-secondary hover:text-theme-text-secondary transition-colors"
        aria-label="Dismiss alert"
      >
        <X size={16} />
      </button>

      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-full bg-theme-surface shadow-sm ${config.color}`}>
          <Icon size={20} />
        </div>
        
        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${config.badge} uppercase tracking-wider`}>
              {alert.category}
            </span>
            <span className="text-xs text-theme-text-secondary font-medium">{timeString}</span>
          </div>
          
          <h4 className="text-sm font-semibold text-theme-text-primary mb-1 leading-tight">
            {alert.title}
          </h4>
          
          <p className="text-xs text-theme-text-secondary mb-3 leading-relaxed">
            {alert.description}
          </p>
          
          {alert.recommendation && (
            <div className="bg-theme-surface rounded border border-theme-border p-2.5">
              <span className="text-[11px] font-bold text-theme-text-secondary uppercase tracking-wider block mb-1">Recommended Action</span>
              <p className="text-xs text-theme-text-primary font-medium">{alert.recommendation}</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

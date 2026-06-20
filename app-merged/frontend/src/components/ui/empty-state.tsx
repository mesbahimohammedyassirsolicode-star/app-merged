import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
}

export function EmptyState({
  title = 'No data available',
  description = 'Try adjusting filters or check again later.',
  icon: Icon = Inbox,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-theme-border glass-panel px-6 py-12 text-center">
      <div className="rounded-full bg-slate-700/30 p-3">
        <Icon className="h-6 w-6 text-theme-text-secondary" />
      </div>
      <p className="mt-4 text-base font-semibold text-theme-text-primary">{title}</p>
      <p className="mt-1 max-w-md text-sm text-theme-text-secondary">{description}</p>
    </div>
  );
}

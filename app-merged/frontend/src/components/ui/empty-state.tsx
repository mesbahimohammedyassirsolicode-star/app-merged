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
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <div className="rounded-full bg-slate-100 p-3">
        <Icon className="h-6 w-6 text-slate-400" />
      </div>
      <p className="mt-4 text-base font-semibold text-slate-700">{title}</p>
      <p className="mt-1 max-w-md text-sm text-slate-500">{description}</p>
    </div>
  );
}

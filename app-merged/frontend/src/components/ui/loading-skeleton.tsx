import { motion } from 'framer-motion';

interface LoadingSkeletonProps {
  statCount?: number;
  cardCount?: number;
}

export function LoadingSkeleton({ statCount = 4, cardCount = 2 }: LoadingSkeletonProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(statCount)].map((_, idx) => (
          <motion.div
            key={`stat-skeleton-${idx}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.3 }}
            className="rounded-2xl border border-theme-border dark:border-theme-border bg-theme-surface dark:bg-theme-surface p-5 shadow-sm"
          >
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-xl bg-slate-200 dark:bg-slate-700/30 animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-700/30 animate-pulse" />
                <div className="h-5 w-1/3 rounded bg-slate-200 dark:bg-slate-700/30 animate-pulse" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[...Array(cardCount)].map((_, idx) => (
          <motion.div
            key={`card-skeleton-${idx}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + idx * 0.1, duration: 0.3 }}
            className="rounded-2xl border border-theme-border dark:border-theme-border bg-theme-surface dark:bg-theme-surface p-6 shadow-sm"
          >
            <div className="h-4 w-40 rounded bg-slate-200 dark:bg-slate-700/30 animate-pulse mb-6" />
            <div className="h-48 w-full rounded-xl bg-theme-surface dark:bg-theme-surface border border-theme-border dark:border-theme-border animate-pulse" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="h-full w-full rounded-xl bg-theme-surface dark:bg-theme-surface border border-theme-border dark:border-theme-border animate-pulse flex flex-col justify-end p-4 gap-2">
      <div className="flex items-end justify-between h-4/5 gap-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-slate-200 dark:bg-slate-700/50 w-full rounded-t" style={{ height: `${20 + Math.random() * 60}%` }} />
        ))}
      </div>
      <div className="flex justify-between h-4 gap-2 mt-2">
         {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-slate-200 dark:bg-slate-700/30 h-2 w-full rounded" />
        ))}
      </div>
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex items-center justify-between py-2 border-b border-theme-border dark:border-theme-border last:border-0">
          <div className="flex items-center gap-3 flex-1">
            <div className="h-10 w-10 rounded bg-slate-200 dark:bg-slate-700/30 animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-3 w-1/3 rounded bg-slate-200 dark:bg-slate-700/30 animate-pulse" />
              <div className="h-2 w-1/4 rounded bg-slate-200 dark:bg-theme-surface animate-pulse" />
            </div>
          </div>
          <div className="h-4 w-12 rounded bg-slate-200 dark:bg-slate-700/30 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

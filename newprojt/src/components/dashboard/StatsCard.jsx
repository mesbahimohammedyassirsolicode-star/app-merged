import { cn } from '../../lib/utils';

export default function StatsCard({ title, value, icon: Icon, trend, trendValue, color }) {
  return (
    <div className="glass border border-border/50 p-6 rounded-2xl hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 group relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10 flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
            {trend && (
              <span className={cn(
                "text-xs font-semibold px-1.5 py-0.5 rounded-full",
                trend === 'up' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
              )}>
                {trend === 'up' ? '+' : '-'}{trendValue}
              </span>
            )}
          </div>
        </div>
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-inner",
          color || "bg-primary/10 text-primary"
        )}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

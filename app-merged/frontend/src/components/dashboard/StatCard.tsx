import type { ReactNode } from 'react';
import { Card, CardContent } from '../ui/card';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: string;
    label: string;
    direction: 'up' | 'down' | 'neutral';
  };
  colorTheme?: 'blue' | 'emerald' | 'orange' | 'purple' | 'cyan' | 'indigo' | 'slate';
  delay?: number;
}

const colorMap = {
  blue: { 
    bg: 'from-blue-500/20 to-blue-600/10',
    icon: 'text-blue-400',
    border: 'border-blue-500/30',
    glow: 'shadow-[0_0_20px_rgba(59,130,246,0.2)]'
  },
  emerald: { 
    bg: 'from-emerald-500/20 to-emerald-600/10',
    icon: 'text-emerald-400',
    border: 'border-emerald-500/30',
    glow: 'shadow-[0_0_20px_rgba(16,185,129,0.2)]'
  },
  orange: { 
    bg: 'from-orange-500/20 to-orange-600/10',
    icon: 'text-orange-400',
    border: 'border-orange-500/30',
    glow: 'shadow-[0_0_20px_rgba(249,115,22,0.2)]'
  },
  purple: { 
    bg: 'from-purple-500/20 to-purple-600/10',
    icon: 'text-purple-400',
    border: 'border-purple-500/30',
    glow: 'shadow-[0_0_20px_rgba(168,85,247,0.2)]'
  },
  cyan: { 
    bg: 'from-cyan-500/20 to-cyan-600/10',
    icon: 'text-cyan-400',
    border: 'border-cyan-500/30',
    glow: 'shadow-[0_0_20px_rgba(6,182,212,0.2)]'
  },
  indigo: { 
    bg: 'from-indigo-500/20 to-indigo-600/10',
    icon: 'text-indigo-400',
    border: 'border-indigo-500/30',
    glow: 'shadow-[0_0_20px_rgba(99,102,241,0.2)]'
  },
  slate: { 
    bg: 'from-slate-500/20 to-slate-600/10',
    icon: 'text-theme-text-secondary',
    border: 'border-theme-border/30',
    glow: 'shadow-[0_0_20px_rgba(148,163,184,0.2)]'
  },
};

export function StatCard({ title, value, icon, trend, colorTheme = 'blue', delay = 0 }: StatCardProps) {
  const colors = colorMap[colorTheme] || colorMap.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, type: 'spring', stiffness: 100 }}
      whileHover={{ y: -5 }}
      className="group h-full"
    >
      <Card className={`relative overflow-hidden border ${colors.border} ${colors.glow} transition-all duration-300`}>
        {/* Animated background gradient */}
        <motion.div
          className={`absolute inset-0 bg-gradient-to-br ${colors.bg} opacity-0 transition-opacity duration-300 group-hover:opacity-60 dark:group-hover:opacity-100`}
          initial={{ opacity: 0 }}
        />

        <CardContent className="relative p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-theme-text-secondary dark:text-theme-text-secondary">{title}</p>
              <motion.p
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: delay + 0.1, duration: 0.3 }}
                className="text-3xl font-bold tracking-tight text-theme-text-primary dark:text-white"
              >
                {value}
              </motion.p>
            </div>
            
            {/* Icon Container with glow */}
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className={`relative flex h-14 w-14 items-center justify-center rounded-[14px] bg-gradient-to-br ${colors.bg} border ${colors.border} ${colors.glow} transition-all duration-300`}
            >
              <div className={`text-xl ${colors.icon} drop-shadow-lg`}>{icon}</div>
            </motion.div>
          </div>
          
          {/* Trend Indicator */}
          {trend && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.2, duration: 0.3 }}
              className="mt-4 flex items-center gap-2 text-sm"
            >
              <div className="flex items-center gap-1">
                {trend.direction === 'up' ? (
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    <span className="font-semibold text-emerald-400">{trend.value}</span>
                  </div>
                ) : trend.direction === 'down' ? (
                  <div className="flex items-center gap-1">
                    <TrendingDown className="h-4 w-4 text-red-400" />
                    <span className="font-semibold text-red-400">{trend.value}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <div className="h-4 w-4 text-theme-text-secondary">→</div>
                    <span className="font-semibold text-theme-text-secondary">{trend.value}</span>
                  </div>
                )}
              </div>
              <span className="text-theme-text-secondary">{trend.label}</span>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

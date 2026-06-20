import React from 'react';

interface StatCardProps {
  title: string;
  value: number | string;
  description?: string;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, description, className }) => {
  const tones = [
    { accent: 'from-sky-500/20 to-sky-500/5', badge: 'text-sky-700 bg-sky-100 border-sky-200' },
    { accent: 'from-emerald-500/20 to-emerald-500/5', badge: 'text-emerald-700 bg-emerald-100 border-emerald-200' },
    { accent: 'from-amber-500/20 to-amber-500/5', badge: 'text-amber-700 bg-amber-100 border-amber-200' },
    { accent: 'from-rose-500/20 to-rose-500/5', badge: 'text-rose-700 bg-rose-100 border-rose-200' },
  ];
  const tone = tones[title.length % tones.length];
  const initials = title
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <article className={`analytics-stat-card ${className ?? ''}`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${tone.accent}`} aria-hidden="true" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--analytics-text-soft)]">{title}</p>
          <p className="text-4xl font-black tracking-tight text-[var(--analytics-text)]">{value}</p>
          {description ? <p className="text-sm text-[var(--analytics-text-soft)]">{description}</p> : <p className="text-sm text-[var(--analytics-text-soft)]">Vue consolidee a partir des donnees actives.</p>}
        </div>
        <div className={`analytics-stat-badge ${tone.badge}`} aria-hidden="true">
          {initials || 'K'}
        </div>
      </div>
    </article>
  );
};

export default StatCard;

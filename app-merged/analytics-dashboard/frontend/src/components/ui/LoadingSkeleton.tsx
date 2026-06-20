import React from 'react';

const LoadingSkeleton: React.FC = () => {
    return (
        <div className="space-y-3 rounded-[24px] border border-[var(--analytics-border)] bg-[var(--analytics-card)] p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.38)]">
            <div className="h-4 w-1/3 rounded-full bg-[var(--analytics-border)]"></div>
            <div className="h-4 w-full rounded-full bg-[var(--analytics-surface-soft)]"></div>
            <div className="h-4 w-5/6 rounded-full bg-[var(--analytics-surface-soft)]"></div>
            <div className="h-4 w-2/3 rounded-full bg-[var(--analytics-surface-soft)]"></div>
            <div className="h-4 w-3/4 rounded-full bg-[var(--analytics-surface-soft)]"></div>
        </div>
    );
};

export default LoadingSkeleton;

import React from 'react';

interface EmptyStateProps {
    message?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ message }) => {
    return (
        <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[24px] border border-dashed border-[var(--analytics-border)] bg-[var(--analytics-surface-soft)] px-6 py-10 text-center">
            <h2 className="text-xl font-bold text-[var(--analytics-text)]">Aucune donnee disponible</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-[var(--analytics-text-soft)]">{message || 'Aucune ligne ne correspond a la selection actuelle. Ajustez les filtres ou revenez plus tard.'}</p>
        </div>
    );
};

export default EmptyState;

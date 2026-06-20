import type { LinkableStagiaireRow } from '../../api/api/parent';

export interface StagiaireSelectorProps {
  rows: LinkableStagiaireRow[];
  selectedIds: number[];
  onToggle: (stagiaireId: number, checked: boolean) => void;
  disabled?: boolean;
}

function formationLabel(row: LinkableStagiaireRow): string {
  const parts = [row.filiere?.label, row.groupe?.label].filter(Boolean);
  return parts.length ? parts.join(' · ') : '—';
}

export default function StagiaireSelector({
  rows,
  selectedIds,
  onToggle,
  disabled = false,
}: StagiaireSelectorProps) {
  const selectedSet = new Set(selectedIds);

  return (
    <ul className="divide-y divide-theme-border rounded-xl border border-theme-border glass-panel">
      {rows.map((row) => {
        const checked = selectedSet.has(row.id);
        const inputId = `stagiaire-${row.id}`;
        return (
          <li key={row.id}>
            <label
              htmlFor={inputId}
              className={`flex cursor-pointer gap-4 px-4 py-3 transition hover:bg-theme-surface ${disabled ? 'pointer-events-none opacity-60' : ''}`}
            >
              <input
                id={inputId}
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={(e) => onToggle(row.id, e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 rounded border-theme-border text-indigo-400 focus:ring-indigo-500"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-theme-text-primary">{row.user?.name ?? `Stagiaire #${row.id}`}</span>
                  <span className="text-xs text-theme-text-secondary">CEF {row.cef_number}</span>
                  {row.has_other_parents ? (
                    <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">
                      Autre parent lié
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-sm text-theme-text-secondary">{formationLabel(row)}</p>
                <p className="mt-0.5 text-xs text-theme-text-secondary">Statut : {row.status}</p>
              </div>
            </label>
          </li>
        );
      })}
    </ul>
  );
}

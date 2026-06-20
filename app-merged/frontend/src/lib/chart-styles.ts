/**
 * Shared Recharts tooltip style helpers.
 * Reads from the document root to pick light/dark colours at call-time
 * so charts always use the correct theme surface without any JS theming logic.
 */

export function getChartTooltipStyle(): React.CSSProperties {
  return {
    borderRadius: '12px',
    border: '1px solid rgb(var(--theme-border))',
    backgroundColor: 'rgb(var(--theme-surface))',
    color: 'rgb(var(--theme-text-primary))',
    boxShadow: '0 10px 24px -12px rgb(2 8 23 / 0.32)',
    fontSize: '13px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  };
}

export function getChartLabelStyle(): React.CSSProperties {
  return { color: 'rgb(var(--theme-text-primary))', fontWeight: 600 };
}

export function getChartAxisColor(): string {
  return 'rgb(var(--theme-text-secondary))';
}

export function getChartGridColor(): string {
  return 'rgb(var(--theme-border) / 0.65)';
}

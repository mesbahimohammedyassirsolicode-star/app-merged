import { useEffect, useState } from 'react';

function readTheme() {
  const styles = getComputedStyle(document.documentElement);
  return {
    surface: styles.getPropertyValue('--analytics-surface').trim(),
    text: styles.getPropertyValue('--analytics-text').trim(),
    textSecondary: styles.getPropertyValue('--analytics-text-soft').trim(),
    border: styles.getPropertyValue('--analytics-border').trim(),
    grid: document.documentElement.classList.contains('dark')
      ? 'rgba(203, 213, 225, 0.16)'
      : 'rgba(71, 85, 105, 0.16)',
  };
}

export function useAnalyticsChartTheme() {
  const [theme, setTheme] = useState(readTheme);

  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(readTheme()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    setTheme(readTheme());
    return () => observer.disconnect();
  }, []);

  return theme;
}

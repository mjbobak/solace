export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = Exclude<Theme, 'system'>;

export const THEME_STORAGE_KEY = 'solace-theme';

export const themeColorVars = {
  page: 'var(--color-page)',
  pageAccent: 'var(--color-page-accent)',
  surface: 'var(--color-surface)',
  surfaceElevated: 'var(--color-surface-elevated)',
  surfaceSubtle: 'var(--color-surface-subtle)',
  text: 'var(--color-text)',
  textMuted: 'var(--color-text-muted)',
  border: 'var(--color-border)',
  brand: 'var(--color-brand)',
  brandMuted: 'var(--color-brand-muted)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  danger: 'var(--color-danger)',
  focus: 'var(--color-focus)',
  overlay: 'var(--color-overlay)',
  inverse: 'var(--color-inverse)',
} as const;

export const chartPalette = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
  'var(--color-chart-6)',
] as const;

export const statusPalette = {
  income: themeColorVars.success,
  spending: themeColorVars.danger,
  budget: themeColorVars.brand,
  variancePositive: themeColorVars.success,
  varianceNegative: themeColorVars.danger,
  essential: themeColorVars.textMuted,
  funsies: 'var(--color-chart-5)',
  investments: 'var(--color-chart-6)',
} as const;

export const chartTheme = {
  grid: themeColorVars.border,
  axis: themeColorVars.textMuted,
  tooltipBackground: themeColorVars.surfaceElevated,
  tooltipBorder: themeColorVars.border,
  tooltipText: themeColorVars.text,
  tooltipBorderRadius: '0.75rem',
  fontSize: '12px',
} as const;

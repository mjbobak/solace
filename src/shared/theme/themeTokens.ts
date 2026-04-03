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

export const budgetSummaryTheme = {
  allocationBlue: 'bg-[#7BB6EB]',
  allocationGreen: 'bg-[#97DDAA]',
  allocationOrange: 'bg-[#F2A36B]',
  allocationPurple: 'bg-[#A890E6]',
  allocationPurpleText: 'text-[#7B63C8]',
  allocationPurpleTextMuted: 'text-[#7B63C8]/75',
  iconContainer:
    'rounded-lg bg-gradient-to-br from-sky-50 to-slate-100 p-2',
  icon: 'h-4 w-4 text-slate-500',
  filteredBadge:
    'inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-violet-600 shadow-sm backdrop-blur',
  filteredBadgeIcon: 'h-3 w-3 text-sky-400',
} as const;

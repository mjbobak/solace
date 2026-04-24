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
  allocationBlue: 'bg-allocation-blue',
  allocationBlueStrong: 'bg-allocation-blue-strong',
  allocationGreen: 'bg-allocation-green',
  allocationOrange: 'bg-allocation-orange',
  allocationPurple: 'bg-allocation-purple',
  allocationPurpleText: 'text-allocation-purple',
  allocationPurpleTextMuted: 'text-allocation-purple-muted',
  summaryCard: 'budget-summary-card',
  summaryTitle: 'budget-summary-title',
  summaryText: 'budget-summary-text',
  summaryTextMuted: 'budget-summary-text-muted',
  summaryValue: 'budget-summary-value',
  summaryDanger: 'budget-summary-danger',
  summaryDangerMuted: 'budget-summary-danger-muted',
  iconContainer: 'budget-summary-icon-tile',
  icon: 'budget-summary-icon',
  controlButton: 'budget-summary-control-button',
  waterfallTrack: 'allocation-waterfall-track',
  waterfallValuePill: 'allocation-waterfall-value-pill',
  waterfallValueAmount: 'allocation-waterfall-value-amount',
  waterfallValuePeriodInside: 'allocation-waterfall-value-period-inside',
  waterfallValuePeriodOutside: 'allocation-waterfall-value-period-outside',
  waterfallInteractiveOverlay: 'allocation-waterfall-step-overlay',
  waterfallTotalOverlay: 'allocation-waterfall-total-overlay',
  filteredBadge:
    'inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-violet-600 shadow-sm backdrop-blur',
  filteredBadgeIcon: 'h-3 w-3 text-sky-400',
} as const;

export const budgetTableTheme = {
  amount: 'budget-table-amount',
  muted: 'budget-table-muted',
  divider: 'budget-table-divider',
  typeBadge: 'budget-table-type-badge',
  typeBadgeEssential: 'budget-table-type-badge-essential',
  typeBadgeFunsies: 'budget-table-type-badge-funsies',
  reserveButton: 'budget-table-reserve-button',
  reserveButtonActive: 'budget-table-reserve-button-active',
  reserveButtonInactive: 'budget-table-reserve-button-inactive',
  spentLink: 'budget-table-spent-link',
  danger: 'budget-table-danger',
  investment: 'budget-table-investment',
} as const;

export const budgetModalTheme = {
  toggleButton: 'budget-modal-toggle-button',
  toggleButtonActive: 'budget-modal-toggle-button-active',
  toggleButtonInactive: 'budget-modal-toggle-button-inactive',
  investmentToggleActive: 'budget-modal-investment-toggle-active',
  reserveToggleActive: 'budget-modal-reserve-toggle-active',
} as const;

import { statusPalette } from '@/shared/theme';

/**
 * Configuration and constants for the dashboard infographic
 */

export const SECTIONS = [
  { id: 'financial-health', label: 'Financial Health' },
  { id: 'income-analysis', label: 'Income' },
  { id: 'budget-analysis', label: 'Budget' },
  { id: 'spending-analysis', label: 'Spending' },
  { id: 'spending-pulse', label: 'Pulse' },
  { id: 'emergency-runway', label: 'Runway' },
  { id: 'money-flow', label: 'Money Flow' },
] as const;

export type SectionId = (typeof SECTIONS)[number]['id'];

export const COLORS = {
  income: statusPalette.income,
  spending: statusPalette.spending,
  budget: statusPalette.budget,
  variancePositive: statusPalette.variancePositive,
  varianceNegative: statusPalette.varianceNegative,
  essential: statusPalette.essential,
  funsies: statusPalette.funsies,
} as const;

export const ANIMATION_CONFIG = {
  triggerOnce: true,
  threshold: 0.2,
  duration: 0.6,
  durationMobile: 0.4,
  thresholdMobile: 0.3,
} as const;

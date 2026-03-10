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
  income: '#10b981', // emerald
  spending: '#f43f5e', // rose
  budget: '#6366f1', // indigo
  variancePositive: '#10b981', // green
  varianceNegative: '#ef4444', // red
  essential: '#6b7280', // gray
  funsies: '#a78bfa', // light purple
} as const;

export const ANIMATION_CONFIG = {
  triggerOnce: true,
  threshold: 0.2,
  duration: 0.6,
  durationMobile: 0.4,
  thresholdMobile: 0.3,
} as const;

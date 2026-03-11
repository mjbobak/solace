/**
 * Configuration for emergency runway calculations and thresholds
 */

export const RUNWAY_THRESHOLDS = {
  green: 12, // > 12 months
  yellow: 6, // 6-12 months
  red: 0, // < 6 months
} as const;

export const RUNWAY_COLORS = {
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
} as const;

export const RUNWAY_SCENARIO_LABELS = {
  personA: 'Person A loses income',
  personB: 'Person B loses income',
  both: 'Both lose income',
} as const;

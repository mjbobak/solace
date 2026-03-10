/**
 * View-specific types for the income feature UI
 * Separate from core income types to allow UI-specific concerns
 */

import type {
  EffectiveDateRange,
  IncomeEntry,
  IncomeFrequency,
  IncomeType,
} from './income';

export type IncomePeriod = 'monthly' | 'annual';
export type IncomeDisplayType = 'net' | 'gross' | 'breakdown';

/**
 * Income entry with calculated display amounts
 * Used by components for rendering with current period/type settings
 */
export interface IncomeWithCalculations extends IncomeEntry {
  displayAmount: number; // Calculated based on period and type
  annualGross: number; // Total annual gross
  annualNet: number; // Total annual net
}

/**
 * Income totals for a specific category (regular/bonus or all combined)
 */
export interface IncomeCategory {
  annualGross: number; // Annual gross
  annualNet: number; // Annual net
  monthlyGross: number; // Monthly average
  monthlyNet: number; // Monthly average
}

/**
 * Totals summary for income calculations
 */
export interface IncomeTotals {
  displayTotal: number; // Total for current period/type
  annualGross: number; // Total annual gross
  annualNet: number; // Total annual net
  monthlyGross?: number; // Monthly average
  monthlyNet?: number; // Monthly average
  taxAndDeductions: number; // Amount withheld (Gross - Net)
  regularIncome: IncomeCategory; // Continuous/salary income
  bonusIncome: IncomeCategory; // One-time/bonus income
}

/**
 * Simple year data point for gross/net display
 */
export interface SimpleYearDataPoint {
  year: string;
  income: number;
}

/**
 * Breakdown year data point showing deduction categories
 * Sum of all fields equals gross
 */
export interface BreakdownYearDataPoint {
  year: string;
  net: number;
  retirement: number;
  federalTax: number;
  stateTax: number;
  fica: number;
  healthInsurance: number;
  other: number;
  gross: number; // For label display on top of bar
}

/**
 * Union type for year-over-year data
 * Simple structure for gross/net views, breakdown structure for breakdown view
 */
export type YearOverYearDataPoint =
  | SimpleYearDataPoint
  | BreakdownYearDataPoint;

/**
 * Type guard to check if data point is breakdown structure
 */
export function isBreakdownData(
  point: YearOverYearDataPoint,
): point is BreakdownYearDataPoint {
  return 'net' in point && 'retirement' in point;
}

/**
 * Effective date range with parent entry context
 * Used when displaying historical ranges in expanded rows
 */
export interface EffectiveDateRangeWithEntry extends EffectiveDateRange {
  entryId: string; // Reference to parent IncomeEntry
  entryType: IncomeType; // For icon color
  entryFrequency: IncomeFrequency; // For icon selection
}

/**
 * Display values for a grouped income entry
 * Contains all calculated and formatted fields for table display
 */
export interface DisplayValues {
  income: string; // Formatted currency, adjusted by toggles
  payPeriods: number | null; // Pay periods per year (26, 24, etc.)
  federalTax: string; // Adjusted by annual/monthly toggle
  stateTax: string;
  fica: string;
  retirement: string;
  healthInsurance: string;
}

/**
 * Income entries grouped by stream name with expansion support
 * Represents a group of income entries with the same stream name
 * Displays the currently active range by default, expandable to show history
 */
export interface GroupedIncomeEntry {
  streamName: string; // Grouping key
  entries: IncomeEntry[]; // All entries with this stream name
  activeEntry: IncomeEntry | null; // Entry with active range
  activeRange: EffectiveDateRange | null; // Currently active or most recent range
  allRanges: EffectiveDateRangeWithEntry[]; // All ranges from all entries, sorted by startDate desc
  displayValues: DisplayValues; // Calculated and formatted display values
  type: IncomeType; // For icon color (continuous/one-time)
  frequency: IncomeFrequency | null; // For icon selection
  isExpanded: boolean; // UI state for expansion
}

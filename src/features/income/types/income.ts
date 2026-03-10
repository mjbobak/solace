/**
 * Core income types and interfaces
 * Defines the data model for income streams with support for:
 * - Effective date ranges (for tracking salary changes)
 * - Multiple income types (regular vs bonus)
 * - Frequency tracking for bonus income
 * - Deduction breakdowns
 */

export type IncomeType = 'regular' | 'bonus';
export type IncomeFrequency = 'annual' | 'quarterly' | 'monthly' | 'one-time';
export type InputType =
  | 'Net Paycheck'
  | 'Gross Paycheck'
  | 'Custom Amount'
  | 'Monthly Amount';

export interface Deductions {
  federalTax?: number;
  stateTax?: number;
  fica?: number;
  retirement?: number;
  healthInsurance?: number;
  other?: number;
}

/**
 * Represents a single effective date range within an income stream
 * Allows tracking multiple periods with different amounts (e.g., salary increases)
 *
 * **SOURCE OF TRUTH**: This is the primary data structure for income amounts.
 * All calculations (annual, net, deductions, etc.) are derived from the effectiveRanges array.
 *
 * Fields:
 * - id: Unique identifier for this range
 * - startDate: When this range becomes effective (ISO 8601 format)
 * - endDate: When this range ends (ISO 8601 or null for ongoing)
 * - grossAmount: Income per pay period (not annualized)
 * - netAmount: Net income per pay period after deductions (not annualized)
 * - periods: Number of pay periods per year (26, 24, 52, 12, etc.)
 * - deductions: Breakdown of deductions from gross to net
 */
export interface EffectiveDateRange {
  id: string; // e.g., "salary-2024-range-001"
  startDate: string; // ISO date (e.g., "2024-01-01")
  endDate: string | null; // ISO date or null for ongoing
  grossAmount: number; // Per pay period
  netAmount: number; // Per pay period
  periods: number; // Pay periods per year (26, 24, 52, 12, etc.)
  deductions?: Deductions;
}

/**
 * Core income entry representing a single income stream
 * Can have multiple effective date ranges to track changes over time
 *
 * **ARCHITECTURE:**
 * - effectiveRanges is the SOURCE OF TRUTH for all income data
 * - All calculations are derived from effectiveRanges
 * - Use helper functions: getCurrentEffectiveRange(), calculateAnnualGross(), calculateAnnualNet()
 *
 * **FIELD CATEGORIES:**
 *
 * Core fields (required):
 * - id: Unique identifier (e.g., "INC-0001")
 * - stream: Display name (e.g., "Marty Salary", "Bonus Q1")
 * - type: 'regular' (salary) or 'bonus' (bonus income)
 * - effectiveRanges: Array of date ranges with amounts (SOURCE OF TRUTH)
 *
 * Metadata (optional):
 * - frequency: For bonus income to track quarterly vs annual bonuses
 * - receivedDate: For bonus income to track when payment was received
 * - createdAt, updatedAt: Timestamps for audit trail and sorting
 */
export interface IncomeEntry {
  // Core identifying information
  id: string; // e.g., "INC-0001"
  stream: string; // e.g., "Marty Salary", "Bonus Q1"
  type: IncomeType; // 'regular' (salary) or 'bonus' (bonus income)

  // Optional metadata
  frequency?: IncomeFrequency; // DEPRECATED for new entries - kept for backward compatibility. New bonus entries always use 'one-time'.
  receivedDate?: string; // For bonus income: ISO date when received (e.g., "2024-12-15")

  // Timestamps for audit trail
  createdAt?: string; // ISO 8601 timestamp when entry was created
  updatedAt?: string; // ISO 8601 timestamp when entry was last modified

  // SOURCE OF TRUTH - Multiple ranges allow tracking changes over time
  effectiveRanges: EffectiveDateRange[];
}

/**
 * Helper to get current/active effective range for today
 * Returns the range that is currently active, or the latest if none is active
 */
export function getCurrentEffectiveRange(
  ranges: EffectiveDateRange[],
): EffectiveDateRange | undefined {
  if (ranges.length === 0) return undefined;

  const today = new Date();
  const activeRange = ranges.find((range) => {
    const start = new Date(range.startDate);
    const end = range.endDate ? new Date(range.endDate) : null;
    return start <= today && (!end || today <= end);
  });

  return activeRange || ranges[ranges.length - 1];
}

/**
 * Helper to calculate annual gross from the current effective range
 */
export function calculateAnnualGross(entry: IncomeEntry): number {
  const activeRange = getCurrentEffectiveRange(entry.effectiveRanges);
  if (!activeRange) {
    return 0;
  }
  return activeRange.grossAmount * activeRange.periods;
}

/**
 * Helper to calculate annual net from the current effective range
 */
export function calculateAnnualNet(entry: IncomeEntry): number {
  const activeRange = getCurrentEffectiveRange(entry.effectiveRanges);
  if (!activeRange) {
    return 0;
  }
  return activeRange.netAmount * activeRange.periods;
}

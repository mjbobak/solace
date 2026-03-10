/**
 * Income calculation utilities
 * Handles calculations for deductions and display values based on period and type toggles
 */

import { formatCurrency } from '@/shared/utils/currency';

import { DEDUCTION_FIELDS } from '../constants/incomeConfig';
import type { Deductions, EffectiveDateRange } from '../types/income';
import type { DisplayValues, IncomePeriod } from '../types/incomeView';

/**
 * Calculate adjusted deduction amount based on period toggle
 * Converts per-period deduction to annual or monthly display amount
 *
 * @param deductionPerPeriod - Amount per pay period
 * @param periodsPerYear - Number of pay periods (26, 24, 52, etc.)
 * @param displayPeriod - 'annual' or 'monthly'
 * @returns Formatted currency string
 */
export function calculateAdjustedDeduction(
  deductionPerPeriod: number,
  periodsPerYear: number,
  displayPeriod: IncomePeriod,
): string {
  const annual = deductionPerPeriod * periodsPerYear;
  const amount = displayPeriod === 'annual' ? annual : annual / 12;
  return formatCurrency(amount);
}

/**
 * Calculate display values for a single effectiveRange
 * Computes all fields needed for table display based on current toggles
 *
 * @param range - The effective date range to calculate from
 * @param period - Display period ('annual' or 'monthly')
 * @param displayType - Display type ('gross' or 'net')
 * @returns Object with all display values formatted as strings
 */
export function calculateDisplayValues(
  range: EffectiveDateRange,
  period: IncomePeriod,
  displayType: 'gross' | 'net',
): DisplayValues {
  const { grossAmount, netAmount, periods, deductions = {} } = range;

  // Income calculation (gross vs net)
  const baseAmount = displayType === 'gross' ? grossAmount : netAmount;
  const annualAmount = baseAmount * periods;
  const income = period === 'annual' ? annualAmount : annualAmount / 12;

  // Build deduction display values from all deduction fields
  const deductionValues = DEDUCTION_FIELDS.reduce(
    (acc, field) => {
      const key = field.key as keyof Deductions;
      acc[key] = calculateAdjustedDeduction(
        deductions[key] || 0,
        periods,
        period,
      );
      return acc;
    },
    {} as Record<keyof Deductions, string>,
  );

  return {
    income: formatCurrency(income),
    payPeriods: periods,
    ...deductionValues,
  } as DisplayValues;
}

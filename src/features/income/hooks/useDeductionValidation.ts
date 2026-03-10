/**
 * Hook for validating deductions against gross and net amounts
 * Calculates validation warnings when deductions don't match the difference between gross and net
 */

import { useMemo } from 'react';

import { formatCurrency } from '@/shared/utils/currency';

import { DEDUCTION_FIELDS } from '../constants/incomeConfig';
import type { Deductions } from '../types/income';

export interface ValidationResult {
  hasWarning: boolean;
  message: string | null;
  calculatedNet: number;
  totalDeductions: number;
}

/**
 * Pure function to calculate deduction validation
 * Can be called from anywhere (hooks, callbacks, etc.)
 */
export function calculateDeductionValidation(
  grossAmount: number,
  netAmount: number,
  deductions?: Deductions,
): ValidationResult {
  // Calculate total deductions from all fields
  const totalDeductions = DEDUCTION_FIELDS.reduce((sum, field) => {
    const key = field.key as keyof Deductions;
    return sum + (deductions?.[key] || 0);
  }, 0);

  // Calculate expected net from gross - deductions
  const calculatedNet = grossAmount - totalDeductions;

  // Check for mismatch (tolerance: $0.01 for rounding)
  const difference = calculatedNet - netAmount;
  const hasWarning = Math.abs(difference) > 0.01;

  let message = null;
  if (hasWarning) {
    message = `Warning: Gross ${formatCurrency(
      grossAmount,
      '$',
    )} - Deductions ${formatCurrency(totalDeductions, '$')} = ${formatCurrency(
      calculatedNet,
      '$',
    )}, but Net is ${formatCurrency(
      netAmount,
      '$',
    )} (difference: ${formatCurrency(difference, '$')})`;
  }

  return {
    hasWarning,
    message,
    calculatedNet,
    totalDeductions,
  };
}

/**
 * Hook version of deduction validation
 * Validates if deductions match the difference between gross and net amounts
 * Returns a warning message if there's a mismatch (tolerance: $0.01)
 */
export function useDeductionValidation(
  grossAmount: number,
  netAmount: number,
  deductions?: Deductions,
): ValidationResult {
  return useMemo(
    () => calculateDeductionValidation(grossAmount, netAmount, deductions),
    [grossAmount, netAmount, deductions],
  );
}

/**
 * Spending aggregation utilities for grouping transactions by category and date range.
 * Used to calculate actual spending for budget comparisons.
 */

import type { SpendingEntry } from '@/features/spending/types/spendingView';
import { getMonthlyTransactionImpacts } from '@/features/spending/utils/spreadPayments';

/**
 * Get the first and last day of a month.
 * @param year - The year
 * @param month - The month (1-12)
 * @returns Object with startDate and endDate
 */
export function getMonthDateRange(
  year: number,
  month: number,
): { startDate: Date; endDate: Date } {
  const startDate = new Date(year, month - 1, 1); // month is 0-indexed in JS
  const endDate = new Date(year, month, 0); // Last day of the month
  return { startDate, endDate };
}

/**
 * Get the first and last day of a year.
 * @param year - The year
 * @returns Object with startDate and endDate
 */
export function getYearDateRange(year: number): {
  startDate: Date;
  endDate: Date;
} {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);
  return { startDate, endDate };
}

/**
 * Check if a transaction date falls within a date range.
 * @param transactionDateStr - Transaction date as ISO string (e.g., "2024-01-15")
 * @param startDate - Start date (inclusive)
 * @param endDate - End date (inclusive)
 * @returns True if transaction is within range
 */
export function isTransactionInRange(
  transactionDateStr: string,
  startDate: Date,
  endDate: Date,
): boolean {
  const txDate = new Date(transactionDateStr);
  // Normalize to date-only comparison (ignore time)
  const txDateOnly = new Date(
    txDate.getFullYear(),
    txDate.getMonth(),
    txDate.getDate(),
  );
  const startDateOnly = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate(),
  );
  const endDateOnly = new Date(
    endDate.getFullYear(),
    endDate.getMonth(),
    endDate.getDate(),
  );

  return txDateOnly >= startDateOnly && txDateOnly <= endDateOnly;
}

/**
 * Aggregate spending transactions by budget ID for a specific date range.
 * @param transactions - Array of spending entries
 * @param startDate - Start date (inclusive)
 * @param endDate - End date (inclusive)
 * @returns Map of budget ID -> total spent amount
 */
export function aggregateSpendingByBudget(
  transactions: SpendingEntry[],
  startDate: Date,
  endDate: Date,
): Map<number, number> {
  const spendingByBudget = new Map<number, number>();

  for (const transaction of transactions) {
    // Skip transactions with no budget link (uncategorized)
    if (!transaction.budgetId) {
      continue;
    }

    const budgetId = transaction.budgetId;
    const currentTotal = spendingByBudget.get(budgetId) ?? 0;
    const transactionTotal = getMonthlyTransactionImpacts(transaction)
      .filter((impact) => isTransactionInRange(impact.monthStart, startDate, endDate))
      .reduce((sum, impact) => sum + impact.amount, 0);

    if (transactionTotal === 0) {
      continue;
    }

    spendingByBudget.set(budgetId, currentTotal + transactionTotal);
  }

  return spendingByBudget;
}

/**
 * Aggregate spending for a specific period (monthly or annual).
 * @param transactions - Array of spending entries
 * @param period - Period type: 'monthly' or 'annual'
 * @param year - The year
 * @param month - The month (1-12), required for monthly period
 * @returns Map of budget ID -> total spent amount
 */
export function aggregateSpendingByPeriod(
  transactions: SpendingEntry[],
  period: 'monthly' | 'annual',
  year: number,
  month?: number,
): Map<number, number> {
  let dateRange: { startDate: Date; endDate: Date };

  if (period === 'monthly') {
    if (month === undefined) {
      throw new Error('Month is required for monthly period aggregation');
    }
    if (month < 1 || month > 12) {
      throw new Error('Month must be between 1 and 12');
    }
    dateRange = getMonthDateRange(year, month);
  } else {
    dateRange = getYearDateRange(year);
  }

  return aggregateSpendingByBudget(
    transactions,
    dateRange.startDate,
    dateRange.endDate,
  );
}

/**
 * Hook for calculating income totals and aggregations
 * Computes summary statistics from filtered income data
 */

import { useMemo } from 'react';

import type { IncomeWithCalculations, IncomeTotals } from '../types/incomeView';

/**
 * Hook to calculate income totals from filtered data
 * Returns totals for display in summary cards, split by income type
 */
export function useIncomeCalculations(incomeData: IncomeWithCalculations[]): {
  totals: IncomeTotals;
} {
  const totals = useMemo(() => {
    // Filter by income type
    const regularIncome = incomeData.filter(
      (entry) => entry.type === 'regular',
    );
    const bonusIncome = incomeData.filter((entry) => entry.type === 'bonus');

    // Calculate regular income totals
    const regularAnnualGross = regularIncome.reduce(
      (sum, entry) => sum + entry.annualGross,
      0,
    );
    const regularAnnualNet = regularIncome.reduce(
      (sum, entry) => sum + entry.annualNet,
      0,
    );

    // Calculate bonus income totals
    const bonusAnnualGross = bonusIncome.reduce(
      (sum, entry) => sum + entry.annualGross,
      0,
    );
    const bonusAnnualNet = bonusIncome.reduce(
      (sum, entry) => sum + entry.annualNet,
      0,
    );

    // Calculate aggregate totals
    const totalAmount = incomeData.reduce(
      (sum, entry) => sum + entry.displayAmount,
      0,
    );
    const totalAnnualGross = regularAnnualGross + bonusAnnualGross;
    const totalAnnualNet = regularAnnualNet + bonusAnnualNet;

    return {
      displayTotal: totalAmount,
      annualGross: totalAnnualGross,
      annualNet: totalAnnualNet,
      monthlyGross: totalAnnualGross / 12,
      monthlyNet: totalAnnualNet / 12,
      taxAndDeductions: totalAnnualGross - totalAnnualNet,
      regularIncome: {
        annualGross: regularAnnualGross,
        annualNet: regularAnnualNet,
        monthlyGross: regularAnnualGross / 12,
        monthlyNet: regularAnnualNet / 12,
      },
      bonusIncome: {
        annualGross: bonusAnnualGross,
        annualNet: bonusAnnualNet,
        monthlyGross: bonusAnnualGross / 12,
        monthlyNet: bonusAnnualNet / 12,
      },
    };
  }, [incomeData]);

  return { totals };
}

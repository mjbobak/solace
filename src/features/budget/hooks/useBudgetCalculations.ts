import { useMemo } from 'react';

import type { BudgetEntry } from '@/features/budget/types/budgetView';

export interface BudgetTotals {
  budgeted: number;
  spent: number;
  remaining: number;
  percentage: number;
}

export function useBudgetCalculations(budgetData: BudgetEntry[]): BudgetTotals {
  return useMemo(() => {
    const totalBudgeted = budgetData.reduce(
      (sum, entry) => sum + entry.budgeted,
      0,
    );
    const totalSpent = budgetData.reduce((sum, entry) => sum + entry.spent, 0);
    const totalRemaining = budgetData.reduce(
      (sum, entry) => sum + entry.remaining,
      0,
    );
    const totalPercentage =
      totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

    return {
      budgeted: totalBudgeted,
      spent: totalSpent,
      remaining: totalRemaining,
      percentage: totalPercentage,
    };
  }, [budgetData]);
}

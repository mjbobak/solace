import { useMemo } from 'react';

import type {
  BudgetEntry,
  ExpenseTypeFilter,
} from '@/features/budget/types/budgetView';

export function useBudgetFiltering(
  budgetEntries: BudgetEntry[],
  expenseTypeFilter: ExpenseTypeFilter,
  expenseCategoryFilter: string[],
): BudgetEntry[] {
  return useMemo(() => {
    let filtered = budgetEntries;

    // Filter by expense type
    if (expenseTypeFilter !== 'ALL') {
      filtered = filtered.filter(
        (entry) => entry.expenseType === expenseTypeFilter,
      );
    }

    // Filter by expense category (OR logic - show if ANY selected category matches)
    if (expenseCategoryFilter.length > 0) {
      filtered = filtered.filter((entry) =>
        expenseCategoryFilter.includes(entry.expenseCategory),
      );
    }

    return filtered;
  }, [budgetEntries, expenseTypeFilter, expenseCategoryFilter]);
}

import { useMemo } from 'react';

import type { SpendingEntry, SpendingFilters } from '../types/spendingView';
import { getMonthlyTransactionImpacts, hasSpreadPayment } from '../utils/spreadPayments';

export function useSpendingFiltering(
  transactions: SpendingEntry[],
  filters: SpendingFilters,
): SpendingEntry[] {
  return useMemo(() => {
    let filtered = transactions;

    if (filters.year.length > 0 || filters.month.length > 0) {
      filtered = filtered.filter((transaction) => {
        const impacts = getMonthlyTransactionImpacts(transaction);

        return impacts.some((impact) => {
          const matchesYear =
            filters.year.length === 0 ||
            filters.year.includes(impact.year.toString());
          const matchesMonth =
            filters.month.length === 0 ||
            filters.month.includes(impact.month.toString());

          return matchesYear && matchesMonth;
        });
      });
    }

    // Filter by accounts (OR logic - show if ANY selected account matches)
    if (filters.accounts.length > 0) {
      filtered = filtered.filter((t) => filters.accounts.includes(t.account));
    }

    // Filter by budget items (OR logic - show if ANY selected budget label/category matches)
    if (filters.budgetCategories.length > 0) {
      filtered = filtered.filter((t) => {
        const matches = new Set<string>([
          t.budgetLabel || 'Uncategorized',
          t.budgetCategory || 'Uncategorized',
        ]);

        return filters.budgetCategories.some((value) => matches.has(value));
      });
    }

    // Filter by accrual status (OR logic - show if ANY selected status matches)
    if (filters.accrualStatus.length > 0) {
      filtered = filtered.filter((t) =>
        filters.accrualStatus.some((status) => {
          const statusAsBoolean = status === 'YES';
          return hasSpreadPayment(t) === statusAsBoolean;
        }),
      );
    }

    // Filter by amount range
    if (filters.amountMin !== undefined) {
      filtered = filtered.filter(
        (t) => Math.abs(t.amount) >= filters.amountMin!,
      );
    }

    if (filters.amountMax !== undefined) {
      filtered = filtered.filter(
        (t) => Math.abs(t.amount) <= filters.amountMax!,
      );
    }

    // Filter by description search (case-insensitive partial match)
    if (filters.searchQuery.trim()) {
      const searchLower = filters.searchQuery.toLowerCase();
      filtered = filtered.filter((t) =>
        t.description.toLowerCase().includes(searchLower),
      );
    }

    return filtered;
  }, [transactions, filters]);
}

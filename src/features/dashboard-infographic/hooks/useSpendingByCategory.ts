import { useEffect, useMemo, useState } from 'react';

import { spendingService } from '@/features/spending/services/spendingService';
import type { SpendingEntry } from '@/features/spending/types/spendingView';
import { getMonthlyTransactionImpacts } from '@/features/spending/utils/spreadPayments';

/** Type alias (not interface) so it satisfies DonutChart's indexed data type. */
export type SpendingCategorySlice = {
  category: string;
  amount: number;
  percentage: number;
};

interface UseSpendingByCategoryResult {
  slices: SpendingCategorySlice[];
  total: number;
  isLoading: boolean;
  error: string | null;
}

const MAX_VISIBLE_CATEGORIES = 7;
const UNCATEGORIZED_LABEL = 'Uncategorized';
const OTHER_LABEL = 'Other';

export function buildSpendingByCategory(
  transactions: SpendingEntry[],
  year: number,
): { slices: SpendingCategorySlice[]; total: number } {
  const totalsByCategory = new Map<string, number>();

  transactions.forEach((transaction) => {
    const category = transaction.budgetCategory?.trim() || UNCATEGORIZED_LABEL;
    getMonthlyTransactionImpacts(transaction).forEach((impact) => {
      if (impact.year !== year) {
        return;
      }
      totalsByCategory.set(
        category,
        (totalsByCategory.get(category) ?? 0) + impact.amount,
      );
    });
  });

  const sorted = Array.from(totalsByCategory.entries())
    .map(([category, amount]) => ({ category, amount }))
    .filter((entry) => entry.amount > 0)
    .sort((left, right) => right.amount - left.amount);

  const total = sorted.reduce((sum, entry) => sum + entry.amount, 0);

  const overflow = sorted.slice(MAX_VISIBLE_CATEGORIES);
  const grouped = overflow.length
    ? [
        ...sorted.slice(0, MAX_VISIBLE_CATEGORIES),
        {
          category: OTHER_LABEL,
          amount: overflow.reduce((sum, entry) => sum + entry.amount, 0),
        },
      ]
    : sorted;

  return {
    total,
    slices: grouped.map((entry) => ({
      ...entry,
      percentage: total > 0 ? (entry.amount / total) * 100 : 0,
    })),
  };
}

export function useSpendingByCategory(
  year: number,
): UseSpendingByCategoryResult {
  const [transactions, setTransactions] = useState<SpendingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const next = await spendingService.getAllTransactions({
          fetchAll: true,
        });

        if (!isCancelled) {
          setTransactions(next);
        }
      } catch (loadError) {
        if (isCancelled) {
          return;
        }

        console.error('Failed to load spending by category:', loadError);
        setTransactions([]);
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load spending data',
        );
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      isCancelled = true;
    };
  }, [year]);

  const { slices, total } = useMemo(
    () => buildSpendingByCategory(transactions, year),
    [transactions, year],
  );

  return { slices, total, isLoading, error };
}

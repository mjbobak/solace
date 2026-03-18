/**
 * Hook to fetch transactions and aggregate spending by budget for the selected year.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';

import { spendingService } from '@/features/spending/services/spendingService';
import type { SpendingEntry } from '@/features/spending/types/spendingView';
import { getMonthlyTransactionImpacts } from '@/features/spending/utils/spreadPayments';
import {
  getMonthIndexFromDateOnly,
  getYearFromDateOnly,
} from '@/shared/utils/dateOnly';
import {
  getCompletedMonthsForYear,
  getSpendBasisHelpText,
  getSpendBasisLabel,
} from '@/shared/utils/spendBasis';

import type { SpendBasis } from '../types/budgetView';

interface UseBudgetSpendingReturn {
  spendingByBudget: Map<number, number>;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  monthlyRange: { low: number; high: number } | null;
  spendBasisLabel: string;
  spendBasisHelpText: string;
}

function getMonthlySpendForBasis(params: {
  spendBasis: SpendBasis;
  monthBuckets: number[];
  currentMonth: number;
  completedMonths: number;
}): number {
  const { spendBasis, monthBuckets, currentMonth, completedMonths } = params;
  const annualTotal = monthBuckets.reduce((sum, value) => sum + value, 0);
  const completedMonthsTotal = monthBuckets
    .slice(0, completedMonths)
    .reduce((sum, value) => sum + value, 0);

  switch (spendBasis) {
    case 'annual_full_year':
      return annualTotal;
    case 'monthly_avg_12':
      return annualTotal / 12;
    case 'monthly_current_month':
      return monthBuckets[currentMonth - 1] ?? 0;
    case 'monthly_avg_elapsed':
      return completedMonthsTotal;
    default:
      return 0;
  }
}

function isLinkedToBudget(transaction: SpendingEntry): boolean {
  return transaction.budgetId !== null && transaction.budgetId !== undefined;
}

export function useBudgetSpending(
  year: number,
  spendBasis: SpendBasis,
  normalizeAccrual: boolean,
  completedMonthsOverride?: number,
): UseBudgetSpendingReturn {
  const [transactions, setTransactions] = useState<SpendingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await spendingService.getAllTransactions({ fetchAll: true });
      setTransactions(data);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load transactions',
      );
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const longMonth = now.toLocaleString('en-US', { month: 'long' });
  const completedMonths =
    completedMonthsOverride ?? getCompletedMonthsForYear(year);

  const monthlyTotalsByBudget = useMemo(() => {
    const bucketsByBudget = new Map<number, number[]>();

    const getBuckets = (budgetId: number): number[] => {
      const existing = bucketsByBudget.get(budgetId);
      if (existing) return existing;
      const created = Array.from({ length: 12 }, () => 0);
      bucketsByBudget.set(budgetId, created);
      return created;
    };

    const linkedTransactions = transactions.filter(isLinkedToBudget);

    for (const transaction of linkedTransactions) {
      const budgetId = transaction.budgetId as number;
      const buckets = getBuckets(budgetId);

      if (normalizeAccrual) {
        for (const impact of getMonthlyTransactionImpacts(transaction)) {
          if (impact.year === year) {
            buckets[impact.month - 1] += impact.amount;
          }
        }
        continue;
      }

      if (getYearFromDateOnly(transaction.transactionDate) !== year) {
        continue;
      }

      const monthIndex = getMonthIndexFromDateOnly(transaction.transactionDate);
      buckets[monthIndex] += transaction.amount;
    }

    return bucketsByBudget;
  }, [transactions, normalizeAccrual, year]);

  const spendingByBudget = useMemo(() => {
    try {
      const result = new Map<number, number>();

      for (const [budgetId, monthBuckets] of monthlyTotalsByBudget.entries()) {
        result.set(
          budgetId,
          getMonthlySpendForBasis({
            spendBasis,
            monthBuckets,
            currentMonth,
            completedMonths,
          }),
        );
      }

      return result;
    } catch (err) {
      console.error('Failed to aggregate spending:', err);
      return new Map<number, number>();
    }
  }, [monthlyTotalsByBudget, completedMonths, spendBasis, currentMonth]);

  const monthlyRange = useMemo(() => {
    if (spendBasis === 'annual_full_year') return null;

    const monthlyTotals = Array.from({ length: 12 }, () => 0);
    for (const monthBuckets of monthlyTotalsByBudget.values()) {
      for (let i = 0; i < 12; i++) {
        monthlyTotals[i] += monthBuckets[i];
      }
    }

    const monthsToUse = spendBasis === 'monthly_avg_12' ? 12 : completedMonths;
    const relevant = monthlyTotals.slice(0, monthsToUse);

    if (relevant.length === 0) {
      return { low: 0, high: 0 };
    }

    return {
      low: Math.min(...relevant),
      high: Math.max(...relevant),
    };
  }, [spendBasis, completedMonths, monthlyTotalsByBudget]);

  const spendBasisLabel = useMemo(() => {
    return getSpendBasisLabel(spendBasis);
  }, [spendBasis]);

  const spendBasisHelpText = useMemo(() => {
    return getSpendBasisHelpText({
      spendBasis,
      year,
      longMonth,
      completedMonths,
    });
  }, [spendBasis, year, completedMonths, longMonth]);

  return {
    spendingByBudget,
    isLoading,
    error,
    refetch: fetchTransactions,
    monthlyRange,
    spendBasisLabel,
    spendBasisHelpText,
  };
}

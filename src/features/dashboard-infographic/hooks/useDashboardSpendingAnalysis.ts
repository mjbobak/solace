import { useEffect, useMemo, useState } from 'react';

import { budgetService } from '@/features/budget/services/budgetService';
import { spendingService } from '@/features/spending/services/spendingService';

import {
  buildDashboardSpendingAnalysis,
  type DashboardSpendingAnalysis,
} from '../utils/spendingAnalysis';

interface UseDashboardSpendingAnalysisReturn {
  analysis: DashboardSpendingAnalysis;
  isLoading: boolean;
  error: string | null;
}

const EMPTY_ANALYSIS: DashboardSpendingAnalysis = {
  totalsByFilter: {
    ALL: 0,
    ESSENTIAL: 0,
    FUNSIES: 0,
  },
  categoriesByFilter: {
    ALL: [],
    ESSENTIAL: [],
    FUNSIES: [],
  },
};

export function useDashboardSpendingAnalysis(
  year: number,
): UseDashboardSpendingAnalysisReturn {
  const [budgets, setBudgets] = useState<
    Awaited<ReturnType<typeof budgetService.getAllBudgets>>
  >([]);
  const [transactions, setTransactions] = useState<
    Awaited<ReturnType<typeof spendingService.getTransactionsByDateRange>>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [nextBudgets, nextTransactions] = await Promise.all([
          budgetService.getAllBudgets({ limit: 1000 }),
          spendingService.getTransactionsByDateRange(
            `${year}-01-01`,
            `${year}-12-31`,
          ),
        ]);

        if (isCancelled) {
          return;
        }

        setBudgets(nextBudgets);
        setTransactions(nextTransactions);
      } catch (err) {
        console.error('Failed to load dashboard spending analysis:', err);

        if (!isCancelled) {
          setBudgets([]);
          setTransactions([]);
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load spending analysis',
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isCancelled = true;
    };
  }, [year]);

  const analysis = useMemo(() => {
    if (budgets.length === 0 && transactions.length === 0) {
      return EMPTY_ANALYSIS;
    }

    return buildDashboardSpendingAnalysis({
      budgets,
      transactions,
      year,
    });
  }, [budgets, transactions, year]);

  return {
    analysis,
    isLoading,
    error,
  };
}

/**
 * Unified hook to fetch budgets and spending data, merging them for display.
 */

import { useEffect, useMemo, useState } from 'react';

import {
  backendToView,
  extractNumericId,
} from '@/features/budget/services/budgetAdapters';
import { budgetService } from '@/features/budget/services/budgetService';
import type { BudgetApiResponse } from '@/features/budget/types/budgetApi';
import {
  getComparisonBudgetForSpendBasis,
  getCompletedMonthsForYear,
} from '@/shared/utils/spendBasis';

import type { BudgetEntry, SpendBasis } from '../types/budgetView';

import { useBudgetSpending } from './useBudgetSpending';

interface UseBudgetDataReturn {
  budgetEntries: BudgetEntry[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  refetchSpending: () => Promise<void>;
  upsertBudgetEntry: (entry: BudgetEntry) => void;
  removeBudgetEntry: (id: string) => void;
  monthlyRange: { low: number; high: number } | null;
  spendBasisLabel: string;
  spendBasisHelpText: string;
}

export function useBudgetData(
  year: number,
  spendBasis: SpendBasis,
  normalizeAccrual: boolean,
  completedMonthsOverride?: number,
): UseBudgetDataReturn {
  const [budgets, setBudgets] = useState<BudgetApiResponse[]>([]);
  const [isLoadingBudgets, setIsLoadingBudgets] = useState(true);
  const [budgetError, setBudgetError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBudgets = async () => {
      try {
        setIsLoadingBudgets(true);
        setBudgetError(null);
        const data = await budgetService.getAllBudgets({ limit: 1000 });
        setBudgets(data);
      } catch (err) {
        console.error('Failed to fetch budgets:', err);
        setBudgetError(
          err instanceof Error ? err.message : 'Failed to load budgets',
        );
        setBudgets([]);
      } finally {
        setIsLoadingBudgets(false);
      }
    };

    fetchBudgets();
  }, []);

  const {
    spendingByBudget,
    isLoading: isLoadingSpending,
    error: spendingError,
    refetch: refetchSpending,
    monthlyRange,
    spendBasisLabel,
    spendBasisHelpText,
  } = useBudgetSpending(
    year,
    spendBasis,
    normalizeAccrual,
    completedMonthsOverride,
  );

  const completedMonths =
    completedMonthsOverride ?? getCompletedMonthsForYear(year);

  const budgetEntries = useMemo(() => {
    try {
      return budgets.map((budget) =>
        backendToView(budget, spendingByBudget, {
          comparisonBudget: getComparisonBudgetForSpendBasis({
            spendBasis,
            monthlyBudget: budget.budgeted,
            completedMonths,
          }),
        }),
      );
    } catch (err) {
      console.error('Failed to merge budget and spending data:', err);
      return [];
    }
  }, [budgets, spendingByBudget, spendBasis, completedMonths]);

  const refetch = async () => {
    try {
      setIsLoadingBudgets(true);
      setBudgetError(null);
      const data = await budgetService.getAllBudgets({ limit: 1000 });
      setBudgets(data);
      await refetchSpending();
    } catch (err) {
      console.error('Failed to refetch budgets:', err);
      setBudgetError(
        err instanceof Error ? err.message : 'Failed to refetch budgets',
      );
    } finally {
      setIsLoadingBudgets(false);
    }
  };

  const upsertBudgetEntry = (entry: BudgetEntry) => {
    const numericId = extractNumericId(entry.id);
    const nowIso = new Date().toISOString();

    setBudgets((prev) => {
      const existing = prev.find((budget) => budget.id === numericId);
      const nextBudget: BudgetApiResponse = {
        id: numericId,
        expense_type: entry.expenseType,
        expense_category: entry.expenseCategory,
        expense_label: entry.expenseLabel,
        expense_label_note: entry.expenseLabelNote,
        is_investment: entry.isInvestment ?? false,
        budgeted: entry.budgeted,
        is_accrual: entry.isAccrual ?? false,
        created_at: existing?.created_at ?? nowIso,
        updated_at: nowIso,
      };

      if (!existing) {
        return [...prev, nextBudget];
      }

      return prev.map((budget) =>
        budget.id === numericId ? nextBudget : budget,
      );
    });
  };

  const removeBudgetEntry = (id: string) => {
    const numericId = extractNumericId(id);
    setBudgets((prev) => prev.filter((budget) => budget.id !== numericId));
  };

  return {
    budgetEntries,
    isLoading: isLoadingBudgets || isLoadingSpending,
    error: budgetError || spendingError,
    refetch,
    refetchSpending,
    upsertBudgetEntry,
    removeBudgetEntry,
    monthlyRange,
    spendBasisLabel,
    spendBasisHelpText,
  };
}

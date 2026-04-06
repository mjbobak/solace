import { useEffect, useMemo, useState } from 'react';

import { budgetService } from '@/features/budget/services/budgetService';
import type { BudgetApiResponse } from '@/features/budget/types/budgetApi';
import { spendingService } from '@/features/spending/services/spendingService';
import type { SpendingEntry } from '@/features/spending/types/spendingView';
import { getMonthlyTransactionImpacts } from '@/features/spending/utils/spreadPayments';

export interface SpendingPulseRow {
  month: string;
  monthIndex: number;
  isRelevant: boolean;
  budget: number;
  actual: number;
  variance: number;
  overBudgetLabels: SpendingPulseLabelDetail[];
}

export interface SpendingPulseLabelDetail {
  label: string;
  budget: number;
  actual: number;
  variance: number;
}

interface UseSpendingPulseDataResult {
  rows: SpendingPulseRow[];
  coverageLabel: string | null;
  isLoading: boolean;
  error: string | null;
}

type MonthlyLabelTotals = Map<string, number>[];

const TOTAL_MONTHS = 12;

function isLinkedToBudget(transaction: SpendingEntry): boolean {
  return transaction.budgetId !== null && transaction.budgetId !== undefined;
}

function getVisibleMonthCount(year: number, now: Date): number {
  const currentYear = now.getFullYear();

  if (year < currentYear) {
    return 12;
  }

  if (year > currentYear) {
    return 0;
  }

  return now.getMonth();
}

function formatMonthLabel(year: number, monthIndex: number): string {
  return new Date(year, monthIndex - 1, 1).toLocaleString('en-US', {
    month: 'short',
  });
}

function buildCoverageLabel(
  year: number,
  visibleMonthCount: number,
): string | null {
  if (visibleMonthCount === 0) {
    return null;
  }

  const startMonth = formatMonthLabel(year, 1);
  const endMonth = formatMonthLabel(year, visibleMonthCount);

  if (visibleMonthCount === 12) {
    return `${startMonth}-${endMonth} ${year}`;
  }

  return `${startMonth}-${endMonth} ${year} (completed months)`;
}

function createMonthlyLabelTotals(): MonthlyLabelTotals {
  return Array.from({ length: TOTAL_MONTHS }, () => new Map<string, number>());
}

function addMonthlyBudgetTotalsByLabel(
  budgets: BudgetApiResponse[],
  monthlyLabelBudgets: MonthlyLabelTotals,
): void {
  budgets.forEach((budget) => {
    monthlyLabelBudgets.forEach((monthBudgetMap) => {
      monthBudgetMap.set(
        budget.expense_label,
        (monthBudgetMap.get(budget.expense_label) ?? 0) + budget.budgeted,
      );
    });
  });
}

function addMonthlyActualTotalsByLabel(params: {
  transactions: SpendingEntry[];
  budgetLabelById: Map<number, string>;
  monthlyActuals: number[];
  monthlyLabelActuals: MonthlyLabelTotals;
  visibleMonthCount: number;
  year: number;
}): void {
  const {
    transactions,
    budgetLabelById,
    monthlyActuals,
    monthlyLabelActuals,
    visibleMonthCount,
    year,
  } = params;

  transactions.filter(isLinkedToBudget).forEach((transaction) => {
    const label = budgetLabelById.get(transaction.budgetId as number);
    if (!label) {
      return;
    }

    getMonthlyTransactionImpacts(transaction).forEach((impact) => {
      if (impact.year !== year || impact.month > visibleMonthCount) {
        return;
      }

      const monthIndex = impact.month - 1;
      monthlyActuals[monthIndex] += impact.amount;

      const monthActualMap = monthlyLabelActuals[monthIndex];
      monthActualMap.set(
        label,
        (monthActualMap.get(label) ?? 0) + impact.amount,
      );
    });
  });
}

function buildOverBudgetLabels(params: {
  monthIndex: number;
  monthlyLabelBudgets: MonthlyLabelTotals;
  monthlyLabelActuals: MonthlyLabelTotals;
}): SpendingPulseLabelDetail[] {
  const { monthIndex, monthlyLabelBudgets, monthlyLabelActuals } = params;
  const monthBudgetMap = monthlyLabelBudgets[monthIndex];
  const monthActualMap = monthlyLabelActuals[monthIndex];
  const labels = new Set([
    ...monthBudgetMap.keys(),
    ...monthActualMap.keys(),
  ]);

  return Array.from(labels)
    .map((label) => {
      const budget = monthBudgetMap.get(label) ?? 0;
      const actual = monthActualMap.get(label) ?? 0;

      return {
        label,
        budget,
        actual,
        variance: budget - actual,
      };
    })
    .filter((detail) => detail.variance < 0)
    .sort(
      (left, right) =>
        Math.abs(right.variance) - Math.abs(left.variance) ||
        left.label.localeCompare(right.label),
    );
}

export function buildSpendingPulseRows(params: {
  year: number;
  budgets: BudgetApiResponse[];
  transactions: SpendingEntry[];
  now?: Date;
}): {
  rows: SpendingPulseRow[];
  coverageLabel: string | null;
} {
  const { year, budgets, transactions, now = new Date() } = params;
  const visibleMonthCount = getVisibleMonthCount(year, now);
  const hasAnyConfiguredBudget = budgets.some((budget) => budget.budgeted !== 0);

  if (visibleMonthCount === 0 && !hasAnyConfiguredBudget) {
    return {
      rows: [],
      coverageLabel: null,
    };
  }

  const monthlyBudgetTotal = budgets.reduce(
    (sum, budget) => sum + budget.budgeted,
    0,
  );
  const budgetLabelById = new Map(
    budgets.map((budget) => [budget.id, budget.expense_label]),
  );
  const monthlyLabelBudgets = createMonthlyLabelTotals();
  const monthlyActuals = Array.from({ length: TOTAL_MONTHS }, () => 0);
  const monthlyLabelActuals = createMonthlyLabelTotals();

  addMonthlyBudgetTotalsByLabel(budgets, monthlyLabelBudgets);
  addMonthlyActualTotalsByLabel({
    transactions,
    budgetLabelById,
    monthlyActuals,
    monthlyLabelActuals,
    visibleMonthCount,
    year,
  });

  const hasAnyRelevantActuals = monthlyActuals
    .slice(0, visibleMonthCount)
    .some((amount) => amount !== 0);
  if (!hasAnyConfiguredBudget && !hasAnyRelevantActuals) {
    return {
      rows: [],
      coverageLabel: null,
    };
  }

  return {
    rows: Array.from({ length: TOTAL_MONTHS }, (_, index) => {
      const isRelevant = index < visibleMonthCount;
      const actual = monthlyActuals[index] ?? 0;

      return {
        month: formatMonthLabel(year, index + 1),
        monthIndex: index + 1,
        isRelevant,
        budget: isRelevant ? monthlyBudgetTotal : 0,
        actual: isRelevant ? actual : 0,
        variance: isRelevant ? monthlyBudgetTotal - actual : 0,
        overBudgetLabels: isRelevant
          ? buildOverBudgetLabels({
              monthIndex: index,
              monthlyLabelBudgets,
              monthlyLabelActuals,
            })
          : [],
      };
    }),
    coverageLabel: buildCoverageLabel(year, visibleMonthCount),
  };
}

export function useSpendingPulseData(
  year: number,
): UseSpendingPulseDataResult {
  const [budgets, setBudgets] = useState<BudgetApiResponse[]>([]);
  const [transactions, setTransactions] = useState<SpendingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [nextBudgets, nextTransactions] = await Promise.all([
          budgetService.getAllBudgets({ limit: 1000 }),
          spendingService.getAllTransactions({ fetchAll: true }),
        ]);

        if (isCancelled) {
          return;
        }

        setBudgets(nextBudgets);
        setTransactions(nextTransactions);
      } catch (loadError) {
        if (isCancelled) {
          return;
        }

        console.error('Failed to load spending pulse data:', loadError);
        setBudgets([]);
        setTransactions([]);
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load spending pulse data',
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

  const { rows, coverageLabel } = useMemo(
    () =>
      buildSpendingPulseRows({
        year,
        budgets,
        transactions,
      }),
    [budgets, transactions, year],
  );

  return {
    rows,
    coverageLabel,
    isLoading,
    error,
  };
}

import '@testing-library/jest-dom/vitest';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { BudgetApiResponse } from '@/features/budget/types/budgetApi';
import { useSpendingPulseData } from '@/features/dashboard-infographic/hooks/useSpendingPulseData';
import type { SpendingEntry } from '@/features/spending/types/spendingView';

const { getAllBudgets, getAllTransactions } = vi.hoisted(() => ({
  getAllBudgets: vi.fn(),
  getAllTransactions: vi.fn(),
}));

vi.mock('@/features/budget/services/budgetService', () => ({
  budgetService: {
    getAllBudgets,
  },
}));

vi.mock('@/features/spending/services/spendingService', () => ({
  spendingService: {
    getAllTransactions,
  },
}));

function createBudget(
  overrides: Partial<BudgetApiResponse> & Pick<BudgetApiResponse, 'id'>,
): BudgetApiResponse {
  const { id, ...rest } = overrides;

  return {
    id,
    expense_type: 'ESSENTIAL',
    expense_category: 'HOUSING',
    expense_label: `Budget ${id}`,
    is_investment: false,
    budgeted: 100,
    is_accrual: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...rest,
  };
}

function createTransaction(
  overrides: Partial<SpendingEntry> &
    Pick<SpendingEntry, 'id' | 'transactionDate'>,
): SpendingEntry {
  const { id, transactionDate, ...rest } = overrides;

  return {
    id,
    account: 'Checking',
    transactionDate,
    postDate: transactionDate,
    description: 'Test transaction',
    budgetLabel: 'Budget',
    budgetId: 101,
    budgetCategory: 'Housing',
    budgetType: 'ESSENTIAL',
    amount: 100,
    isAccrual: false,
    spreadStartDate: null,
    spreadMonths: null,
    ...rest,
  };
}

describe('useSpendingPulseData', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-05T12:00:00Z'));
    getAllBudgets.mockReset();
    getAllTransactions.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('builds completed-month rows for the selected year using spread-normalized transaction impacts', async () => {
    getAllBudgets.mockResolvedValue([
      createBudget({ id: 101, budgeted: 100 }),
      createBudget({ id: 202, budgeted: 50 }),
    ]);
    getAllTransactions.mockResolvedValue([
      createTransaction({
        id: 'jan-groceries',
        transactionDate: '2026-01-10',
        amount: 80,
      }),
      createTransaction({
        id: 'quarterly-insurance',
        transactionDate: '2026-02-14',
        amount: 120,
        budgetId: 202,
        isAccrual: true,
        spreadStartDate: '2026-02-01',
        spreadMonths: 3,
      }),
      createTransaction({
        id: 'uncategorized-ignore',
        transactionDate: '2026-03-10',
        amount: 999,
        budgetId: null,
      }),
      createTransaction({
        id: 'prior-year-ignore',
        transactionDate: '2025-12-20',
        amount: 500,
      }),
    ]);

    const { result } = renderHook(() => useSpendingPulseData(2026));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.coverageLabel).toBe('Jan-Mar 2026 (completed months)');
    expect(result.current.rows).toEqual([
      {
        month: 'Jan',
        monthIndex: 1,
        budget: 150,
        actual: 80,
        variance: 70,
        overBudgetLabels: [],
      },
      {
        month: 'Feb',
        monthIndex: 2,
        budget: 150,
        actual: 40,
        variance: 110,
        overBudgetLabels: [],
      },
      {
        month: 'Mar',
        monthIndex: 3,
        budget: 150,
        actual: 40,
        variance: 110,
        overBudgetLabels: [],
      },
    ]);
    expect(getAllBudgets).toHaveBeenCalledWith({ limit: 1000 });
    expect(getAllTransactions).toHaveBeenCalledWith({ fetchAll: true });
  });

  it('returns an empty data set when the selected year has no completed spending activity', async () => {
    getAllBudgets.mockResolvedValue([createBudget({ id: 101, budgeted: 100 })]);
    getAllTransactions.mockResolvedValue([]);

    const { result } = renderHook(() => useSpendingPulseData(2027));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.coverageLabel).toBeNull();
    expect(result.current.rows).toEqual([]);
  });

  it('captures monthly expense-label overages for the drill-down view', async () => {
    getAllBudgets.mockResolvedValue([
      createBudget({
        id: 101,
        expense_category: 'FOOD',
        expense_label: 'Groceries',
        budgeted: 100,
      }),
      createBudget({
        id: 202,
        expense_category: 'FOOD',
        expense_label: 'Restaurants',
        budgeted: 25,
      }),
      createBudget({
        id: 303,
        expense_category: 'UTILITIES',
        expense_label: 'Internet',
        budgeted: 75,
      }),
    ]);
    getAllTransactions.mockResolvedValue([
      createTransaction({
        id: 'food-jan',
        transactionDate: '2026-01-08',
        budgetId: 101,
        amount: 110,
      }),
      createTransaction({
        id: 'food-jan-extra',
        transactionDate: '2026-01-12',
        budgetId: 202,
        amount: 30,
      }),
      createTransaction({
        id: 'utilities-jan',
        transactionDate: '2026-01-18',
        budgetId: 303,
        amount: 60,
      }),
    ]);

    const { result } = renderHook(() => useSpendingPulseData(2026));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.rows[0]?.overBudgetLabels).toEqual([
      {
        label: 'Groceries',
        budget: 100,
        actual: 110,
        variance: -10,
      },
      {
        label: 'Restaurants',
        budget: 25,
        actual: 30,
        variance: -5,
      },
    ]);
  });
});

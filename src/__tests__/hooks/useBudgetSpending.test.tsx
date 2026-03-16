import '@testing-library/jest-dom/vitest';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useBudgetSpending } from '@/features/budget/hooks/useBudgetSpending';
import type { SpendingEntry } from '@/features/spending/types/spendingView';

const { getAllTransactions } = vi.hoisted(() => ({
  getAllTransactions: vi.fn(),
}));

vi.mock('@/features/spending/services/spendingService', () => ({
  spendingService: {
    getAllTransactions,
  },
}));

function createTransaction(
  overrides: Partial<SpendingEntry> & Pick<SpendingEntry, 'id' | 'transactionDate'>,
): SpendingEntry {
  return {
    id: overrides.id,
    account: 'Checking',
    transactionDate: overrides.transactionDate,
    postDate: overrides.transactionDate,
    description: 'Test transaction',
    budgetLabel: 'Groceries',
    budgetId: 101,
    budgetCategory: 'Daily Living',
    budgetType: 'ESSENTIAL',
    amount: 100,
    isAccrual: false,
    spreadStartDate: null,
    spreadMonths: null,
    ...overrides,
  };
}

describe('useBudgetSpending', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-15T12:00:00Z'));
    getAllTransactions.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('limits completed-month totals to transactions from the selected year', async () => {
    getAllTransactions.mockResolvedValue([
      createTransaction({
        id: '2025-jan',
        transactionDate: '2025-01-10',
        amount: 1000,
      }),
      createTransaction({
        id: '2025-feb',
        transactionDate: '2025-02-10',
        amount: 800,
      }),
      createTransaction({
        id: '2026-jan',
        transactionDate: '2026-01-10',
        amount: 120,
      }),
      createTransaction({
        id: '2026-feb',
        transactionDate: '2026-02-10',
        amount: 80,
      }),
      createTransaction({
        id: '2026-mar',
        transactionDate: '2026-03-10',
        amount: 500,
      }),
    ]);

    const { result } = renderHook(() =>
      useBudgetSpending(2026, 'monthly_avg_elapsed', false),
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.spendingByBudget.get(101)).toBe(200);
    expect(result.current.monthlyRange).toEqual({ low: 80, high: 120 });
    expect(getAllTransactions).toHaveBeenCalledWith({ fetchAll: true });
  });

  it('uses spread impacts instead of raw transaction timing when normalization is enabled', async () => {
    getAllTransactions.mockResolvedValue([
      createTransaction({
        id: 'spread-home-insurance',
        transactionDate: '2026-01-20',
        amount: 600,
        isAccrual: true,
        spreadStartDate: '2026-01-01',
        spreadMonths: 6,
      }),
      createTransaction({
        id: 'march-groceries',
        transactionDate: '2026-03-10',
        amount: 50,
      }),
    ]);

    const { result } = renderHook(() =>
      useBudgetSpending(2026, 'monthly_current_month', true),
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.spendingByBudget.get(101)).toBe(150);
    expect(result.current.monthlyRange).toEqual({ low: 100, high: 100 });
  });
});

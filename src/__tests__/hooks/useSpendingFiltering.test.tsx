import '@testing-library/jest-dom/vitest';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useSpendingFiltering } from '@/features/spending/hooks/useSpendingFiltering';
import type {
  SpendingEntry,
  SpendingFilters,
} from '@/features/spending/types/spendingView';

const transactions: SpendingEntry[] = [
  {
    id: '1',
    account: 'Checking',
    transactionDate: '2026-01-12',
    postDate: '2026-01-12',
    description: 'Primary groceries',
    budgetLabel: 'Groceries',
    budgetId: 77,
    budgetCategory: 'FOOD',
    budgetType: 'ESSENTIAL',
    amount: 120,
    isAccrual: false,
    spreadStartDate: null,
    spreadMonths: null,
  },
  {
    id: '2',
    account: 'Checking',
    transactionDate: '2026-01-15',
    postDate: '2026-01-15',
    description: 'Food category duplicate',
    budgetLabel: 'Dining',
    budgetId: 88,
    budgetCategory: 'FOOD',
    budgetType: 'FUNSIES',
    amount: 45,
    isAccrual: false,
    spreadStartDate: null,
    spreadMonths: null,
  },
];

function createFilters(overrides: Partial<SpendingFilters> = {}): SpendingFilters {
  return {
    year: [],
    month: [],
    accounts: [],
    budgetCategories: [],
    budgetId: undefined,
    accrualStatus: [],
    amountMin: undefined,
    amountMax: undefined,
    forceEmpty: false,
    searchQuery: '',
    ...overrides,
  };
}

describe('useSpendingFiltering', () => {
  it('applies exact budget id filtering before broader label or category filters', () => {
    const { result } = renderHook(() =>
      useSpendingFiltering(
        transactions,
        createFilters({
          budgetId: 77,
          budgetCategories: ['FOOD'],
        }),
      ),
    );

    expect(result.current.map((transaction) => transaction.id)).toEqual(['1']);
  });

  it('returns no transactions when the drill-through is force-empty', () => {
    const { result } = renderHook(() =>
      useSpendingFiltering(
        transactions,
        createFilters({
          budgetId: 77,
          budgetCategories: ['FOOD'],
          forceEmpty: true,
        }),
      ),
    );

    expect(result.current).toEqual([]);
  });

  it('restores normal filtering when the drill-through filter is removed', () => {
    const { result, rerender } = renderHook(
      ({ filters }) => useSpendingFiltering(transactions, filters),
      {
        initialProps: {
          filters: createFilters({
            budgetId: 77,
            budgetCategories: ['FOOD'],
          }),
        },
      },
    );

    expect(result.current.map((transaction) => transaction.id)).toEqual(['1']);

    rerender({
      filters: createFilters({
        budgetCategories: ['FOOD'],
      }),
    });

    expect(result.current.map((transaction) => transaction.id)).toEqual([
      '1',
      '2',
    ]);
  });
});

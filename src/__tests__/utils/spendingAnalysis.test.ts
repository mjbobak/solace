import { describe, expect, it } from 'vitest';

import type { BudgetApiResponse } from '@/features/budget/types/budgetApi';
import type { SpendingEntry } from '@/features/spending/types/spendingView';
import { buildDashboardSpendingAnalysis } from '@/features/dashboard-infographic/utils/spendingAnalysis';

const budgets: BudgetApiResponse[] = [
  {
    id: 1,
    expense_type: 'ESSENTIAL',
    expense_category: 'Housing',
    expense_label: 'Rent',
    budgeted: 2000,
    is_accrual: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 2,
    expense_type: 'FUNSIES',
    expense_category: 'Entertainment',
    expense_label: 'Fun',
    budgeted: 300,
    is_accrual: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

function createTransaction(
  overrides: Partial<SpendingEntry> & Pick<SpendingEntry, 'id' | 'transactionDate'>,
): SpendingEntry {
  const { id, transactionDate, ...rest } = overrides;

  return {
    id,
    account: 'Checking',
    transactionDate,
    postDate: transactionDate,
    description: 'Transaction',
    budgetLabel: 'Category',
    amount: 100,
    budgetId: null,
    budgetCategory: undefined,
    budgetType: undefined,
    isAccrual: false,
    spreadStartDate: null,
    spreadMonths: null,
    ...rest,
  };
}

describe('buildDashboardSpendingAnalysis', () => {
  it('groups real spending into all, essential, and funsies views', () => {
    const analysis = buildDashboardSpendingAnalysis({
      budgets,
      year: 2026,
      transactions: [
        createTransaction({
          id: 'housing',
          transactionDate: '2026-01-10',
          amount: 1200,
          budgetId: 1,
        }),
        createTransaction({
          id: 'movies',
          transactionDate: '2026-02-12',
          amount: 200,
          budgetId: 2,
        }),
        createTransaction({
          id: 'misc',
          transactionDate: '2026-03-05',
          amount: 75,
        }),
      ],
    });

    expect(analysis.totalsByFilter.ALL).toBe(1475);
    expect(analysis.totalsByFilter.ESSENTIAL).toBe(1200);
    expect(analysis.totalsByFilter.FUNSIES).toBe(200);
    expect(analysis.categoriesByFilter.ALL).toEqual([
      { name: 'Housing', value: 1200 },
      { name: 'Entertainment', value: 200 },
      { name: 'Uncategorized', value: 75 },
    ]);
    expect(analysis.categoriesByFilter.ESSENTIAL).toEqual([
      { name: 'Housing', value: 1200 },
    ]);
    expect(analysis.categoriesByFilter.FUNSIES).toEqual([
      { name: 'Entertainment', value: 200 },
    ]);
  });

  it('uses accrual impacts and ignores spending outside the selected year', () => {
    const analysis = buildDashboardSpendingAnalysis({
      budgets,
      year: 2026,
      transactions: [
        createTransaction({
          id: 'annual-pass',
          transactionDate: '2025-12-15',
          amount: 1200,
          budgetId: 2,
          isAccrual: true,
          spreadStartDate: '2025-12-01',
          spreadMonths: 12,
        }),
        createTransaction({
          id: 'prior-year-rent',
          transactionDate: '2025-11-10',
          amount: 999,
          budgetId: 1,
        }),
      ],
    });

    expect(analysis.totalsByFilter.ALL).toBe(1100);
    expect(analysis.totalsByFilter.ESSENTIAL).toBe(0);
    expect(analysis.totalsByFilter.FUNSIES).toBe(1100);
    expect(analysis.categoriesByFilter.FUNSIES).toEqual([
      { name: 'Entertainment', value: 1100 },
    ]);
  });
});

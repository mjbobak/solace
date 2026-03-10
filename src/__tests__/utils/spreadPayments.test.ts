import { describe, expect, it } from 'vitest';

import type { SpendingEntry } from '@/features/spending/types/spendingView';
import {
  getImpactForMonth,
  getMonthlyTransactionImpacts,
} from '@/features/spending/utils/spreadPayments';

function createTransaction(overrides?: Partial<SpendingEntry>): SpendingEntry {
  return {
    id: '1',
    account: 'Checking',
    transactionDate: '2026-01-15',
    postDate: '2026-01-16',
    description: 'Insurance',
    budgetLabel: 'Car Insurance',
    amount: 600,
    isAccrual: false,
    spreadStartDate: null,
    spreadMonths: null,
    ...overrides,
  };
}

describe('spreadPayments', () => {
  it('keeps a non-spread transaction in its transaction month', () => {
    const impacts = getMonthlyTransactionImpacts(createTransaction());

    expect(impacts).toEqual([
      {
        year: 2026,
        month: 1,
        amount: 600,
        monthStart: '2026-01-01',
      },
    ]);
  });

  it('allocates a six-month spread across the selected range', () => {
    const transaction = createTransaction({
      spreadStartDate: '2026-01-01',
      spreadMonths: 6,
      isAccrual: true,
    });

    const impacts = getMonthlyTransactionImpacts(transaction);

    expect(impacts).toHaveLength(6);
    expect(impacts.map((impact) => impact.month)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(impacts.every((impact) => impact.amount === 100)).toBe(true);
  });

  it('uses the selected spread start month rather than the transaction month', () => {
    const transaction = createTransaction({
      transactionDate: '2026-01-15',
      spreadStartDate: '2026-03-01',
      spreadMonths: 3,
      amount: 300,
      isAccrual: true,
    });

    expect(getImpactForMonth(transaction, 2026, 1)).toBe(0);
    expect(getImpactForMonth(transaction, 2026, 3)).toBe(100);
  });

  it('allocates across year boundaries', () => {
    const transaction = createTransaction({
      transactionDate: '2025-11-20',
      spreadStartDate: '2025-11-01',
      spreadMonths: 6,
      amount: 600,
      isAccrual: true,
    });

    expect(getImpactForMonth(transaction, 2025, 11)).toBe(100);
    expect(getImpactForMonth(transaction, 2025, 12)).toBe(100);
    expect(getImpactForMonth(transaction, 2026, 1)).toBe(100);
    expect(getImpactForMonth(transaction, 2026, 4)).toBe(100);
  });

  it('preserves exact totals when rounding cents', () => {
    const transaction = createTransaction({
      amount: 100,
      spreadStartDate: '2026-01-01',
      spreadMonths: 3,
      isAccrual: true,
    });

    const total = getMonthlyTransactionImpacts(transaction).reduce(
      (sum, impact) => sum + impact.amount,
      0,
    );

    expect(total).toBe(100);
  });
});

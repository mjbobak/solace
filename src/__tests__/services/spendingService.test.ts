import { afterEach, describe, expect, it, vi } from 'vitest';

import { spendingService } from '@/features/spending/services/spendingService';

function createTransactionApiResponse(overrides?: Record<string, unknown>) {
  return {
    id: 1,
    date: '2025-01-15',
    post_date: '2025-01-16',
    description: 'Internet Bill',
    merchant: 'Internet Bill',
    amount: '65.00',
    account: 'Checking',
    budget_id: 42,
    budget_label: 'Internet',
    budget_category: 'UTILITY',
    budget_type: 'ESSENTIAL',
    is_accrual: true,
    spread_start_date: '2025-01-01',
    spread_months: 6,
    status: 'active',
    review_status: 'pending',
    import_batch_id: null,
    user_id: 1,
    created_at: '2025-01-15T00:00:00Z',
    updated_at: '2025-01-15T00:00:00Z',
    ...overrides,
  };
}

describe('spendingService.updateTransaction', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not clear budget_id when toggling spread payment', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => createTransactionApiResponse(),
    });

    vi.stubGlobal('fetch', fetchMock);

    await spendingService.updateTransaction('1', { isAccrual: true });

    expect(fetchMock).toHaveBeenCalledWith('/api/transactions/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_accrual: true }),
    });
  });

  it('includes budget_id when explicitly recategorizing a transaction', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () =>
        createTransactionApiResponse({
          budget_id: 77,
          budget_label: 'Phone',
          is_accrual: false,
        }),
    });

    vi.stubGlobal('fetch', fetchMock);

    await spendingService.updateTransaction('1', {
      budgetId: 77,
      isAccrual: false,
    });

    expect(fetchMock).toHaveBeenCalledWith('/api/transactions/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ budget_id: 77, is_accrual: false }),
    });
  });

  it('includes spread metadata when updating a spread payment', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () =>
        createTransactionApiResponse({
          spread_start_date: '2025-03-01',
          spread_months: 6,
          is_accrual: true,
        }),
    });

    vi.stubGlobal('fetch', fetchMock);

    await spendingService.updateTransaction('1', {
      spreadStartDate: '2025-03-01',
      spreadMonths: 6,
    });

    expect(fetchMock).toHaveBeenCalledWith('/api/transactions/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        spread_start_date: '2025-03-01',
        spread_months: 6,
      }),
    });
  });
});

describe('spendingService.bulkUpdateTransactionsIndividually', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends each transaction its own spread payload', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () =>
          createTransactionApiResponse({
            id: 1,
            date: '2026-07-15',
            spread_start_date: '2026-01-01',
            spread_months: 12,
            is_accrual: true,
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () =>
          createTransactionApiResponse({
            id: 2,
            date: '2027-02-10',
            spread_start_date: '2027-01-01',
            spread_months: 12,
            is_accrual: true,
          }),
      });

    vi.stubGlobal('fetch', fetchMock);

    await spendingService.bulkUpdateTransactionsIndividually([
      {
        id: '1',
        updates: {
          isAccrual: true,
          spreadStartDate: '2026-01-01',
          spreadMonths: 12,
        },
      },
      {
        id: '2',
        updates: {
          isAccrual: true,
          spreadStartDate: '2027-01-01',
          spreadMonths: 12,
        },
      },
    ]);

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/transactions/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        is_accrual: true,
        spread_start_date: '2026-01-01',
        spread_months: 12,
      }),
    });

    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/transactions/2', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        is_accrual: true,
        spread_start_date: '2027-01-01',
        spread_months: 12,
      }),
    });
  });
});

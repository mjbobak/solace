import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { BudgetApiResponse } from '@/features/budget/types/budgetApi';
import { CsvPreviewTableEnhanced } from '@/features/spending/components/CsvPreviewTableEnhanced';
import type { ParsedTransaction } from '@/features/spending/types/csvUpload';

function buildTransaction(
  overrides: Partial<ParsedTransaction>,
): ParsedTransaction {
  return {
    preview_id: 'preview-1',
    row_number: 2,
    account: '1466',
    account_name: 'Chase Credit Card',
    transaction_date: '2026-03-01',
    post_date: '2026-03-02',
    description: 'Default Description',
    amount: 10,
    chase_category: 'Food & Drink',
    is_filtered: false,
    filter_reason: null,
    validation_errors: [],
    details: null,
    budget_id: null,
    auto_categorized: false,
    ...overrides,
  };
}

const budgets: BudgetApiResponse[] = [
  {
    id: 1,
    expense_type: 'ESSENTIAL',
    expense_category: 'HOME',
    expense_label: 'Mortgage',
    is_investment: false,
    budgeted: 1000,
    is_accrual: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 2,
    expense_type: 'FUNSIES',
    expense_category: 'FOOD',
    expense_label: 'Restaurants',
    is_investment: false,
    budgeted: 200,
    is_accrual: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

describe('CsvPreviewTableEnhanced', () => {
  it('shows only filtered rows in the filtered tab even when row numbers repeat across files', () => {
    const transactions = [
      buildTransaction({
        preview_id: 'file-a:2:0',
        row_number: 2,
        description: 'Included Coffee',
        is_filtered: false,
      }),
      buildTransaction({
        preview_id: 'file-b:2:0',
        row_number: 2,
        account: '2939',
        account_name: 'Chase Checking',
        transaction_date: null,
        post_date: '2026-03-03',
        description: 'Filtered Mortgage',
        amount: 3955.28,
        chase_category: null,
        is_filtered: true,
        filter_reason: 'Already imported',
      }),
    ];

    render(
      <CsvPreviewTableEnhanced
        transactions={transactions}
        budgets={budgets}
        onEditTransaction={vi.fn()}
        onToggleFiltered={vi.fn()}
        stats={{
          total: 2,
          importing: 1,
          filtered: 1,
          errors: 0,
        }}
      />,
    );

    expect(screen.getByText('Included Coffee')).toBeInTheDocument();
    expect(screen.queryByText('Filtered Mortgage')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Filtered (1)' }));

    expect(screen.getByText('Filtered Mortgage')).toBeInTheDocument();
    expect(screen.queryByText('Included Coffee')).not.toBeInTheDocument();
  });

  it('shows the inclusion or exclusion reason in a visible status column', () => {
    const transactions = [
      buildTransaction({
        preview_id: 'included-1',
        description: 'Included Coffee',
        is_filtered: false,
      }),
      buildTransaction({
        preview_id: 'filtered-1',
        description: 'Filtered Mortgage',
        is_filtered: true,
        filter_reason: 'Already imported',
      }),
    ];

    render(
      <CsvPreviewTableEnhanced
        transactions={transactions}
        budgets={budgets}
        onEditTransaction={vi.fn()}
        onToggleFiltered={vi.fn()}
        stats={{
          total: 2,
          importing: 1,
          filtered: 1,
          errors: 0,
        }}
      />,
    );

    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Included')).toBeInTheDocument();
    expect(screen.getAllByText('Ready to import').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: 'All Rows (2)' }));

    expect(screen.getByText('Excluded')).toBeInTheDocument();
    expect(screen.getByText('Already imported')).toBeInTheDocument();
  });

  it('shows the suggested budget and lets the user override it for this import', () => {
    const onEditTransaction = vi.fn();
    const transactions = [
      buildTransaction({
        preview_id: 'budget-1',
        description: 'Coffee Shop',
        budget_id: 1,
        auto_categorized: true,
      }),
    ];

    render(
      <CsvPreviewTableEnhanced
        transactions={transactions}
        budgets={budgets}
        onEditTransaction={onEditTransaction}
        onToggleFiltered={vi.fn()}
        stats={{
          total: 1,
          importing: 1,
          filtered: 0,
          errors: 0,
        }}
      />,
    );

    expect(screen.getByText('Mortgage')).toBeInTheDocument();
    expect(screen.getByText('HOME • ESSENTIAL')).toBeInTheDocument();
    expect(screen.getByText('Auto')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Mortgage'));

    const budgetSelect = screen.getByDisplayValue('Mortgage (ESSENTIAL)');
    fireEvent.change(budgetSelect, { target: { value: '2' } });

    expect(onEditTransaction).toHaveBeenCalledWith('budget-1', {
      budget_id: 2,
      auto_categorized: false,
    });
  });
});
